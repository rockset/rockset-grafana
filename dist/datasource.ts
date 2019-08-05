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

  parseTimeFromValue(value) {
    // date is a datetime string
    if (typeof(value) === 'string') {
      return Date.parse(value);
    }
    // date is raw number of seconds
    return value;
  }

  createTimeSeriesData(value: Object, timeSeriesColName: string): Object[] {
    const data = [];
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
      // don't construct a graph with time series as values
      if (key === timeSeriesColName) {
        continue;
      }
      const fieldValues = targets[key];
      if (!(timeSeriesColName in targets)) {
        throw new Error("Specified timeseries column not found");
      }
      const times = targets[timeSeriesColName];
      const datapoints = [];
      for (let idx = 0; idx < fieldValues.length; idx += 1) {
        datapoints.push([
          fieldValues[idx],
          this.parseTimeFromValue(times[idx])
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

  processQueryResult(values: Object[], displayTypes: string[], timeSeriesCols: string[]) {
    let data = [];
    for (let valueIdx = 0; valueIdx < values.length; valueIdx+=1) {
      const value = values[valueIdx];
      const timeSeriesCol = timeSeriesCols[valueIdx];
      if (displayTypes[valueIdx] === 'table') {
        data.push(this.createTableData(value));
      } else {
        data.push(...this.createTimeSeriesData(value, timeSeriesCol));
      }
    }
    return { data: data };
  }

  // Wrap with relevant time info
  wrapSqlQuery(sqlQuery: string, timeSeriesCol: string, startTime: number, endTime: number, timeColType: string): string {
    let wrappedQuery = 'WITH user_query as (' + sqlQuery;
    if (timeColType === 'timestamp') {
      wrappedQuery += `
      ) SELECT * FROM user_query WHERE UNIX_SECONDS(${timeSeriesCol}) > ${startTime}
      AND UNIX_SECONDS(${timeSeriesCol}) < ${endTime}`;
    } else {
      wrappedQuery += `
      ) SELECT * FROM user_query WHERE ${timeSeriesCol} > ${startTime}
      AND ${timeSeriesCol} < ${endTime}`;
    }
    return wrappedQuery;
  }

  parseQueries(options: any, timeSeriesCols: string[], timeColTypes: string[]): Object[] {
    (window as any).options = options;
    const targets = options.targets;
    let queries = [];
    for (let idx = 0; idx < targets.length; idx+=1) {
      const queryInfo = targets[idx];
      const timeColType = timeColTypes[idx]
      let queryObject = {};
      queryObject['sql'] = {};
      if (queryInfo['target']) {
        let sqlQuery = queryInfo['target'];
        if (sqlQuery[sqlQuery.length - 1] === ';'){
          throw new Error("Semicolons at the end of queries not supported");
        }
      sqlQuery = this.wrapSqlQuery(sqlQuery, timeSeriesCols[idx], options.range['from'].unix(), options.range['to'].unix(), timeColType);
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

  parseTimeSeriesCols(targets: Object[]): string[] {
    return targets.map(target => target['timeseriesCol']);
  }

  parseTimeColTypes(targets: Object[]): string[] {
    return targets.map(target => target['timeColType']);
  }

  query(options) {
    let timeSeriesCols = this.parseTimeSeriesCols(options.targets);
    let timeColTypes = this.parseTimeColTypes(options.targets);
    let queries = this.parseQueries(options, timeSeriesCols, timeColTypes);
    if (queries.length === 0) {
      return this.$q.when({ data: [] });
    }
    let reqs = this.constructQueryRequests(queries);
    let displayTypes = this.parseDisplayTypes(options.targets);
    return Promise.all(reqs).then((res) => {
      return this.processQueryResult(res, displayTypes, timeSeriesCols);
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
