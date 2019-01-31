import _ from "lodash";
import rockset from "./api.js";

export class GenericDatasource {

  constructor(instanceSettings, $q, backendSrv, templateSrv) {
    console.log("GenericDatasource constructor");
    this.type = instanceSettings.type;
    this.url = instanceSettings.url;
    this.name = instanceSettings.name;
    this.q = $q;
    this.backendSrv = backendSrv;
    this.templateSrv = templateSrv;
    this.withCredentials = instanceSettings.withCredentials;
    this.headers = {'Content-Type': 'application/json'};
    if (typeof instanceSettings.basicAuth === 'string' && instanceSettings.basicAuth.length > 0) {
      this.headers['Authorization'] = instanceSettings.basicAuth;
    }
    if (instanceSettings.jsonData === undefined) {
      this.apiserver = " " // needed to support grunt unit tests
      console.log("Setting apiserver to empty string")
    } else {
      this.apiserver = instanceSettings.jsonData.apiserver;
      console.log("Setting apiserver to " + instanceSettings.jsonData.apiserver);
    }
    if (instanceSettings.jsonData === undefined) {
      this.apikey = " " // needed to support grunt unit tests
      console.log("Setting apikey to empty string")
    } else {
      this.apikey = instanceSettings.jsonData.apikey;
      console.log("Setting apikey to " + instanceSettings.jsonData.apikey);
    }
    this.rocksetClient  = rockset({'apikey':this.apikey, 'host':this.apiserver});
    console.log("GenericDatasource constructor done.");
  }

  query(options) {
    console.log("GenericDatasource query");
    var query = this.buildQueryParameters(options);
    query.targets = query.targets.filter(t => !t.hide);

    if (query.targets.length <= 0) {
      return this.q.when({data: []});
    }

    if (this.templateSrv.getAdhocFilters) {
      query.adhocFilters = this.templateSrv.getAdhocFilters(this.name);
    } else {
      query.adhocFilters = [];
    }
    console.log("Query ");
    console.log(query)

    return this.doRequest({
      url: this.url + '/query',
      data: query,
      method: 'POST'
    });
  }

  testDatasource() {
    console.log("GenericDatasource testDatasource");
    return this.rocksetClient.queryInternal('select 1')
        .then(res => {
            return { status: 'success', message: 'Rockset Service OK' };
        });

    /**
    return this.doRequest({
      url: this.url + '/',
      method: 'GET',
    }).then(response => {
      if (response.status === 200) {
        return { status: "success", message: "Data source is working", title: "Success" };
      }
    });
    **/
  }

  annotationQuery(options) {
    console.log("GenericDatasource annotationQuery");
    var query = this.templateSrv.replace(options.annotation.query, {}, 'glob');
    var annotationQuery = {
      range: options.range,
      annotation: {
        name: options.annotation.name,
        datasource: options.annotation.datasource,
        enable: options.annotation.enable,
        iconColor: options.annotation.iconColor,
        query: query
      },
      rangeRaw: options.rangeRaw
    };

    return this.doRequest({
      url: this.url + '/annotations',
      method: 'POST',
      data: annotationQuery
    }).then(result => {
      return result.data;
    });
  }

  metricFindQuery(query) {
    console.log("GenericDatasource metricFindQuery");
    var interpolated = {
        target: this.templateSrv.replace(query, null, 'regex')
    };

    return this.doRequest({
      url: this.url + '/search',
      data: interpolated,
      method: 'POST',
    }).then(this.mapToTextValue);
  }

  mapToTextValue(result) {
    return _.map(result.data, (d, i) => {
      if (d && d.text && d.value) {
        return { text: d.text, value: d.value };
      } else if (_.isObject(d)) {
        return { text: d, value: i};
      }
      return { text: d, value: d };
    });
  }

  doRequest(options) {
    options.withCredentials = this.withCredentials;
    options.headers = this.headers;

    return this.backendSrv.datasourceRequest(options);
  }

  buildQueryParameters(options) {
    console.log("GenericDatasource buildQueryParameters");
    //remove placeholder targets
    options.targets = _.filter(options.targets, target => {
      return target.target !== 'select metric';
    });

    var targets = _.map(options.targets, target => {
      return {
        target: this.templateSrv.replace(target.target, options.scopedVars, 'regex'),
        refId: target.refId,
        hide: target.hide,
        type: target.type || 'timeserie'
      };
    });

    options.targets = targets;

    return options;
  }

  getTagKeys(options) {
    console.log("GenericDatasource getTagKeys");
    return new Promise((resolve, reject) => {
      this.doRequest({
        url: this.url + '/tag-keys',
        method: 'POST',
        data: options
      }).then(result => {
        return resolve(result.data);
      });
    });
  }

  getTagValues(options) {
    console.log("GenericDatasource getTagValues");
    return new Promise((resolve, reject) => {
      this.doRequest({
        url: this.url + '/tag-values',
        method: 'POST',
        data: options
      }).then(result => {
        return resolve(result.data);
      });
    });
  }

}
