///<reference path="../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />

import _ from 'lodash';

export default class RocksetDatasource {
  apiKey: string;
  backendsrv: any;
  headers: Object;
  id: number;
  name: string;
  url: string;

  /** @ngInject */
  constructor(instanceSettings, private backendSrv, private templateSrv, private $q) {
    this.name = instanceSettings.name;
    this.id = instanceSettings.id;
    this.backendsrv = backendSrv;
    this.headers = {'Content-Type': 'application/json'};
    this.headers['Authorization'] = `ApiKey ${instanceSettings.jsonData['apiKey']}`;
    this.url = 'https://api.rs2.usw2.rockset.com';
  }

  findTimeSeriesCol(value: Object) {
    const columnFields = value['data']['column_fields'];
    const results = value['data']['results'];
    if (results.length === 0) {
      throw new Error("No results returned from your query");
    }
    const sampleRow = results[0];
    let timeSeriesCount = 0;
    let timeSeriesColumnName: string;
    for (const colField of columnFields) {
      const colName = colField['name'];
      const rowValue = sampleRow[colName];
      const date = Date.parse(rowValue);
      // Right now, we only accept timestamp strings from the rockset response
      if (typeof(rowValue) !== 'string' || isNaN(date)) {
        continue;
      }
      timeSeriesColumnName = colName;
      timeSeriesCount += 1;
    }
    if (timeSeriesCount === 0) {
      throw new Error("Timeseries not found in query response");
    } else if (timeSeriesCount > 1) {
      throw new Error("Multiple timeseries in query not supported");
    }
    return timeSeriesColumnName;
  }


  createTimeSeriesData(value: Object): Object[] {
    const data = [];
    const timeSeriesCol = this.findTimeSeriesCol(value);
    const targets = {};
    for (const row of value['data']['results']) {
      for (var key in row) {
        if (!(key in targets)) {
          targets[key] = [];
        }
        targets[key].push(row[key]);
      }
    }
    for (const key in targets) {
      // don't construct a time series graph
      if (key === timeSeriesCol) {
        continue;
      }
      const fieldValues = targets[key];
      const times = targets[timeSeriesCol];
      const datapoints = [];
      for (let idx = 0; idx < fieldValues.length; idx += 1) {
        datapoints.push([
          fieldValues[idx],
          Date.parse(times[idx])
        ]);
      }
      data.push({
        "target": key,
        "datapoints": datapoints
      });
    }
    return data;
  }

  createTableData(value: Object): Object {
    const columns = [];
    const rows = [];
    const columnInfo = value['data']['column_fields'];
    const resultValues = value['data']['results'];
    const columnNames = [];
    for (let colIdx = 0; colIdx < columnInfo.length; colIdx+=1) {
      const colInfo = columnInfo[colIdx];
      columnNames.push(colInfo['name']);
      columns.push({"text": colInfo['name'], "type": colInfo['type']});
    }
    for (let valIdx = 0; valIdx < resultValues.length; valIdx+=1) {
      const rowValues = resultValues[valIdx];
      const row = [];
      for (let colNameIdx = 0; colNameIdx < columnNames.length; colNameIdx+=1) {
        const columnName = columnNames[colNameIdx];
        row.push(rowValues[columnName]);
      }
      rows.push(row);
    }
    let data = {
      "columns": columns,
      "rows": rows,
      "type": "table"
    };
    return data;
  }

  processQueryResult(values: Object[], displayTypes: string[]) {
    let data = [];
    for (let valueIdx = 0; valueIdx < values.length; valueIdx+=1) {
      const value = values[valueIdx];
      if (displayTypes[valueIdx] === 'table') {
        data.push(this.createTableData(value));
      } else {
        data.push(...this.createTimeSeriesData(value));
      }
    }
    return { data: data };
  }

  parseQueries(targets: Object[]): Object[] {
    let queries = [];
    for (let idx = 0; idx < targets.length; idx+=1) {
      const queryInfo = targets[idx];
      let queryObject = {};
      queryObject['sql'] = {};
      if (queryInfo['target']) {
        let sqlQuery = queryInfo['target'];
        queryObject['sql']['query'] = sqlQuery;
        queries.push(queryObject);
      }
    }
    return queries;
  }

  constructQueryRequests(queries: Object[]): any[] {
    let reqs = [];
    for (let idx = 0; idx < queries.length; idx+=1) {
      let data = queries[idx];
      let request = this.doRequest({
        url: this.url + '/v1/orgs/self/queries',
        data: data,
        method: 'POST'
      });
      reqs.push(request);
    }
    return reqs;
  }

  parseDisplayTypes(targets: Object[]): any[] {
    return targets.map(target => target['type']);
  }

  query(options) {
    let queries = this.parseQueries(options.targets);
    if (queries.length === 0) {
      return this.$q.when({ data: [] });
    }
    let reqs = this.constructQueryRequests(queries);
    let displayTypes = this.parseDisplayTypes(options.targets);
    return Promise.all(reqs).then((res) => {
      return this.processQueryResult(res, displayTypes);
    });
  }

  annotationQuery(options) {
    throw new Error("Annotation Support not implemented yet.");
  }

  metricFindQuery(query: string) {
    throw new Error("Template Variable Support not implemented yet.");
  }

  doRequest(options) {
    options.headers = this.headers;
    return this.backendSrv.datasourceRequest(options);
  }

  testDatasource() {
    return this.doRequest({
      // We test an API key method here to make sure the user is authenticated.
      url: this.url + '/v1/orgs/self/users/self/apikeys',
      method: 'GET',
    }).then(() => {
      return { status: 'success', message: 'Database Connection OK' };
    })
    .catch((err: any) => {
      console.error(err);
      if (err.data && err.data.message) {
        return { status: 'error', message: err.data.message };
      } else {
        return { status: 'error', message: err.status };
      }
    });
  }
}
