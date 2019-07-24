///<reference path="../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />

import _ from 'lodash';

export default class RocksetDatasource {
  apiKey: string;
  id: number;
  name: string;

  /** @ngInject */
  constructor(instanceSettings, private backendSrv, private templateSrv, private $q) {
    this.name = instanceSettings.name;
    this.apiKey = instanceSettings.jsonData['apiKey'];
    this.id = instanceSettings.id;
  }

  query(options) {
    throw new Error("Query Support not implemented yet.");
  }

  annotationQuery(options) {
    throw new Error("Annotation Support not implemented yet.");
  }

  metricFindQuery(query: string) {
    throw new Error("Template Variable Support not implemented yet.");
  }

  testDatasource() {
    console.log(this);
    return this.$q.when({
      status: 'error',
      message: 'Data Source is just a template and has not been implemented yet.',
      title: 'Error'
    });
  }
}
