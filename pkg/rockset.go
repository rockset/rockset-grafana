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
  IntervalMs    uint64 `json:"intervalMs"`
  MaxDataPoints uint64 `json:"maxDataPoints"`
  QueryText     string `json:"queryText"`
}

func (rd *RocksetDatasource) query(ctx context.Context, rs *rockset.RockClient, query backend.DataQuery) backend.DataResponse {
  // Unmarshal the json into our queryModel
  var qm queryModel

  response := backend.DataResponse{}

  response.Error = json.Unmarshal(query.JSON, &qm)
  if response.Error != nil {
    return response
  }

  log.DefaultLogger.Info("query model", "interval", qm.IntervalMs, "max data points", qm.MaxDataPoints, "query text", qm.QueryText)

  // create data frame response
  frame := data.NewFrame("response")

  log.DefaultLogger.Info("json",
    "raw", string(query.JSON),
    "queryType", query.QueryType,
    "refID", query.RefID)

  log.DefaultLogger.Info("time range", "from", query.TimeRange.From, "to", query.TimeRange.To,
    "d", query.TimeRange.To.Sub(query.TimeRange.From).String())

  var qr api.QueryResponse
  qr, _, response.Error = rs.Query(api.QueryRequest{Sql: &api.QueryRequestSql{
    Parameters: []api.QueryParameter{
      {
        Name:  "start",
        Type_: "timestamp",
        Value: query.TimeRange.From.UTC().Format(time.RFC3339),
      },
      {
        Name:  "stop",
        Type_: "timestamp",
        Value: query.TimeRange.To.UTC().Format(time.RFC3339),
      },
    },
    Query: `SELECT
    TIME_BUCKET(HOURS(1), _events._event_time) AS bucket,
    _events.type,
    count(_events.type) AS cnt
FROM
    commons._events
WHERE
    _events._event_time > :start
    AND _events._event_time < :stop
GROUP BY
    bucket,
    _events.type
ORDER BY
    bucket
`,
    DefaultRowLimit: 100,
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
  log.DefaultLogger.Info("got response", "stats", *qr.Stats, "results", len(qr.Results))

  for i, c := range qr.ColumnFields {
    log.DefaultLogger.Info("column", "i", i, "name", c.Name, "type", c.Type_)
  }

  timeCol := "bucket"
  valueCol := "cnt"

  var times []time.Time
  var values []float64

  for i, q := range qr.Results {
    log.DefaultLogger.Info("result", "i", i)
    m, ok := q.(map[string]interface{})
    if !ok {
      log.DefaultLogger.Warn("could not cast result")
      continue
    }

    k := m[timeCol].(string)
    t, err := time.Parse(time.RFC3339Nano, k)
    if err != nil {
      log.DefaultLogger.Error("failed to convert string to time", "s", k, "err", err.Error())
    } else {
      times = append(times, t)
    }

    f := m[valueCol].(float64)
    values = append(values, f)
  }

  log.DefaultLogger.Info("times", "array", times)
  log.DefaultLogger.Info("values", "array", values)

  labels := data.Labels{"type": "foo"}
  // add the time dimension
  frame.Fields = append(frame.Fields,
    data.NewField("time", nil, times),
  )

  // add values
  frame.Fields = append(frame.Fields,
    data.NewField("values", labels, values),
  )

  // add the frames to the response
  response.Frames = append(response.Frames, frame)

  return response
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
  // Called before creatinga a new instance to allow plugin authors
  // to cleanup.
}
