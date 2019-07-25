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

  processQueryResult(values: any) {
    console.log("values are", values);
    let data = [];
    for (const valueIdx in values) {
      const value = values[valueIdx];
      data.push(value['data']['results']);
    }
    return { data: data };
  }

  parseQueries(targets: Object[]): Object[] {
    let queries = [];
    for (const idx in targets) {
      const queryInfo = targets[idx];
      let queryObject = {};
      queryObject['sql'] = {};
      let sqlQuery = queryInfo['target'];
      sqlQuery = "SELECT count(*) FROM kubernetes_events";
      queryObject['sql']['query'] = sqlQuery;
      queryObject['sql']['parameters'] = [
        {
            "name": "_id",
            "type": "string",
            "value": "85beb391"
          }
      ];
      queries.push(queryObject);
    }
    return queries;
  }

  constructQueryRequests(queries: Object[]): any[] {
    let reqs = [];
    for (const idx in queries) {
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

  query(options) {
    console.log("options are", options);
    return this.$q.when({ data: [] });
    let queries = this.parseQueries(options.targets);
    if (queries.length === 0) {
      return this.$q.when({ data: [] });
    }
    let reqs = this.constructQueryRequests(queries);
    return Promise.all(reqs).then((res) => {
      return this.processQueryResult(res);
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
      console.log(err);
      if (err.data && err.data.message) {
        return { status: 'error', message: err.data.message };
      } else {
        return { status: 'error', message: err.status };
      }
    });
  }
}
