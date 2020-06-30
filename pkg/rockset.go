package main

import (
  "context"
  "encoding/json"
  "errors"
  "fmt"
  "github.com/davecgh/go-spew/spew"
  "github.com/rockset/rockset-go-client"
  api "github.com/rockset/rockset-go-client/lib/go"
  "net/http"
  "os"
  "time"

  "github.com/grafana/grafana-plugin-sdk-go/backend"
  "github.com/grafana/grafana-plugin-sdk-go/backend/datasource"
  "github.com/grafana/grafana-plugin-sdk-go/backend/instancemgmt"
  "github.com/grafana/grafana-plugin-sdk-go/backend/log"
  "github.com/grafana/grafana-plugin-sdk-go/data"
)

// newDatasource returns datasource.ServeOpts.
func newDatasource() datasource.ServeOpts {
  // creates a instance manager for your plugin. The function passed
  // into `NewInstanceManger` is called when the instance is created
  // for the first time or when a datasource configuration changed.
  im := datasource.NewInstanceManager(newDataSourceInstance)
  ds := &RocksetDatasource{
    im: im,
  }

  return datasource.ServeOpts{
    QueryDataHandler:   ds,
    CheckHealthHandler: ds,
  }
}

// RocksetDatasource is a backend datasource used to access a Rockset database
type RocksetDatasource struct {
  // The instance manager can help with lifecycle management
  // of datasource instances in plugins. It's not a requirements
  // but a best practice that we recommend that you follow.
  im instancemgmt.InstanceManager
}

// QueryData handles multiple queries and returns multiple responses.
// req contains the queries []DataQuery (where each query contains RefID as a unique identifer).
// The QueryDataResponse contains a map of RefID to the response for each query, and each response
// contains Frames ([]*Frame).
func (rd *RocksetDatasource) QueryData(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
  log.DefaultLogger.Info("QueryData", "request", req)
  spew.Fdump(os.Stderr, req)

  // TODO(pme) pass api server too
  //req.PluginContext.AppInstanceSettings.
  //id := req.PluginContext.DataSourceInstanceSettings.ID
  apiKey, found := req.PluginContext.DataSourceInstanceSettings.DecryptedSecureJSONData["apiKey"]
  if !found {
    return nil, fmt.Errorf("could not locate apiKey")
  }

  rs, err := rockset.NewClient(rockset.WithAPIKey(apiKey))
  if err != nil {
    return nil, fmt.Errorf("could create Rockset client: %w", err)
  }

  // create response struct
  response := backend.NewQueryDataResponse()

  // loop over queries and execute them individually.
  for i, q := range req.Queries {
    log.DefaultLogger.Debug("running query", "i", i, "len", len(req.Queries))
    res := rd.query(ctx, rs, q)

    // save the response in a hashmap
    // based on with RefID as identifier
    response.Responses[q.RefID] = res
  }

  return response, nil
}

type queryModel struct {
  IntervalMs      uint64 `json:"intervalMs"`
  MaxDataPoints   int32  `json:"maxDataPoints"`
  QueryText       string `json:"queryText"`
  QueryParamStart string `json:"queryParamStart"`
  QueryParamStop  string `json:"queryParamStop"`
  QueryTimeField  string `json:"queryTimeField"`
}

func (rd *RocksetDatasource) query(ctx context.Context, rs *rockset.RockClient, query backend.DataQuery) backend.DataResponse {
  // Unmarshal the json into our queryModel
  var qm queryModel

  response := backend.DataResponse{}

  response.Error = json.Unmarshal(query.JSON, &qm)
  if response.Error != nil {
    return response
  }

  log.DefaultLogger.Info("query model",
    "interval", qm.IntervalMs, "max data points", qm.MaxDataPoints, "query text", qm.QueryText)
  log.DefaultLogger.Info("time range", "from", query.TimeRange.From, "to", query.TimeRange.To,
    "d", query.TimeRange.To.Sub(query.TimeRange.From).String())

  var qr api.QueryResponse
  // TODO: use a ctx to make the Query so it the query can be cancelled, but this requires updating the Go client library
  qr, _, response.Error = rs.Query(api.QueryRequest{Sql: &api.QueryRequestSql{
    Parameters: []api.QueryParameter{
      {
        Name:  qm.QueryParamStart,
        Type_: "timestamp",
        Value: query.TimeRange.From.UTC().Format(time.RFC3339),
      },
      {
        Name:  qm.QueryParamStop,
        Type_: "timestamp",
        Value: query.TimeRange.To.UTC().Format(time.RFC3339),
      },
      // interval
      // limit
    },
    Query:           qm.QueryText,
    DefaultRowLimit: qm.MaxDataPoints,
  }})
  if response.Error != nil {
    if e, ok := rockset.AsRocksetError(response.Error); ok {
      log.DefaultLogger.Error("query error", "error", e.Message)
      response.Error = errors.New(e.Message)
    } else {
      log.DefaultLogger.Error("query error", "error", response.Error.Error())
    }
    return response
  }
  log.DefaultLogger.Info("query response", "elapsedTime", qr.Stats.ElapsedTimeMs, "results", len(qr.Results))

  for i, c := range qr.ColumnFields {
    //skip the time field
    if c.Name == qm.QueryTimeField {
      continue
    }
    log.DefaultLogger.Info("column", "i", i, "name", c.Name)

    // add the frames to the response
    frame, err := makeFrame(qm.QueryTimeField, c.Name, qr)
    if err != nil {
      response.Error = fmt.Errorf("failed to create frame for %s: %w", c.Name, err)
      return response
    }

    // only add the frame if it contains any useful data
    if frame.Fields[1].Len() > 0 {
      response.Frames = append(response.Frames, frame)
    }
  }

  if len(response.Frames) == 0 {
    response.Error = fmt.Errorf("no usable columns found in query response")
  }

  return response
}

func makeFrame(timeField, valueField string, qr api.QueryResponse) (*data.Frame, error) {
  frame := data.NewFrame(valueField)

  var times []time.Time
  var values []float64

  for _, q := range qr.Results {
    m, ok := q.(map[string]interface{})
    if !ok {
      return nil, fmt.Errorf("could not cast query response to map: %+v", q)
    }

    // the value might not be present in every row
    v, found := m[valueField]
    if !found {
      continue
    }

    // TODO: this is a bit naïve and could be improved, as the rows can be of different types
    f, ok := v.(float64)
    if !ok {
      // TODO: is there a way to send warnings back to the Grafana UI?
      log.DefaultLogger.Error("could cast %s to float64: %v", valueField, v)
      continue
    }
    values = append(values, f)

    // TODO: time conversion could be cached as it is parsed each call to makeFrame
    t, err := parseTime(m, timeField)
    if err != nil {
      return nil, err
    }
    times = append(times, t)
  }

  // add the time dimension
  frame.Fields = append(frame.Fields, data.NewField("time", nil, times))

  // add values
  frame.Fields = append(frame.Fields, data.NewField("values", nil, values))

  return frame, nil
}

func parseTime(fields map[string]interface{}, key string) (time.Time, error) {
  ifc, ok := fields[key]
  if !ok {
    // TODO include a list of available columns
    return time.Time{}, fmt.Errorf("could not find column %s in query response", key)
  }

  k, ok := ifc.(string)
  if !ok {
    return time.Time{}, fmt.Errorf("could cast %s to string", key)
  }

  t, err := time.Parse(time.RFC3339Nano, k)
  if err != nil {
    return time.Time{}, fmt.Errorf("failed to convert %s to time: %w", k, err)
  }

  return t, nil
}

// CheckHealth handles health checks sent from Grafana to the plugin.
// The main use case for these health checks is the test button on the
// datasource configuration page which allows users to verify that
// a datasource is working as expected.
func (rd *RocksetDatasource) CheckHealth(ctx context.Context, req *backend.CheckHealthRequest) (*backend.CheckHealthResult, error) {
  log.DefaultLogger.Info("health check", "req", req.PluginContext.DataSourceInstanceSettings)

  apiKey, found := req.PluginContext.DataSourceInstanceSettings.DecryptedSecureJSONData["apiKey"]
  if !found {
    return healthError("failed to get api key"), nil
  }

  rs, err := rockset.NewClient(rockset.WithAPIKey(apiKey))
  if err != nil {
    return healthError("failed to create Rockset client: %s", err.Error()), nil
  }

  // validate that we can connect by getting the org info
  _, _, err = rs.Organization()
  if err != nil {
    return healthError("failed get connect to Rockset: %s", err.Error()), nil
  }

  return &backend.CheckHealthResult{
    Status:  backend.HealthStatusOk,
    Message: "Rockset datasource is working",
  }, nil
}

func healthError(msg string, args ...string) *backend.CheckHealthResult {
  return &backend.CheckHealthResult{
    Status:  backend.HealthStatusError,
    Message: fmt.Sprintf(msg, args),
  }
}

type instanceSettings struct {
  httpClient *http.Client
}

func newDataSourceInstance(setting backend.DataSourceInstanceSettings) (instancemgmt.Instance, error) {
  return &instanceSettings{
    httpClient: &http.Client{},
  }, nil
}

func (s *instanceSettings) Dispose() {
  // Called before creating a new instance to allow plugin authors to cleanup.
  log.DefaultLogger.Info("dispose")
}
