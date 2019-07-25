///<reference path="../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />
System.register([], function(exports_1) {
    var RocksetDatasource;
    return {
        setters:[],
        execute: function() {
            RocksetDatasource = (function () {
                /** @ngInject */
                function RocksetDatasource(instanceSettings, backendSrv, templateSrv, $q) {
                    this.backendSrv = backendSrv;
                    this.templateSrv = templateSrv;
                    this.$q = $q;
                    this.name = instanceSettings.name;
                    this.id = instanceSettings.id;
                    this.backendsrv = backendSrv;
                    this.headers = { 'Content-Type': 'application/json' };
                    this.headers['Authorization'] = "ApiKey " + instanceSettings.jsonData['apiKey'];
                    this.url = 'https://api.rs2.usw2.rockset.com';
                }
                RocksetDatasource.prototype.processQueryResult = function (values) {
                    console.log("values are", values);
                    var data = [];
                    for (var valueIdx in values) {
                        var value = values[valueIdx];
                        data.push(value['data']['results']);
                    }
                    return { data: data };
                };
                RocksetDatasource.prototype.parseQueries = function (targets) {
                    var queries = [];
                    for (var idx in targets) {
                        var queryInfo = targets[idx];
                        var queryObject = {};
                        queryObject['sql'] = {};
                        var sqlQuery = queryInfo['target'];
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
                };
                RocksetDatasource.prototype.constructQueryRequests = function (queries) {
                    var reqs = [];
                    for (var idx in queries) {
                        var data = queries[idx];
                        var request = this.doRequest({
                            url: this.url + '/v1/orgs/self/queries',
                            data: data,
                            method: 'POST'
                        });
                        reqs.push(request);
                    }
                    return reqs;
                };
                RocksetDatasource.prototype.query = function (options) {
                    var _this = this;
                    console.log("options are", options);
                    return this.$q.when({ data: [] });
                    var queries = this.parseQueries(options.targets);
                    if (queries.length === 0) {
                        return this.$q.when({ data: [] });
                    }
                    var reqs = this.constructQueryRequests(queries);
                    return Promise.all(reqs).then(function (res) {
                        return _this.processQueryResult(res);
                    });
                };
                RocksetDatasource.prototype.annotationQuery = function (options) {
                    throw new Error("Annotation Support not implemented yet.");
                };
                RocksetDatasource.prototype.metricFindQuery = function (query) {
                    throw new Error("Template Variable Support not implemented yet.");
                };
                RocksetDatasource.prototype.doRequest = function (options) {
                    options.headers = this.headers;
                    return this.backendSrv.datasourceRequest(options);
                };
                RocksetDatasource.prototype.testDatasource = function () {
                    return this.doRequest({
                        // We test an API key method here to make sure the user is authenticated.
                        url: this.url + '/v1/orgs/self/users/self/apikeys',
                        method: 'GET',
                    }).then(function () {
                        return { status: 'success', message: 'Database Connection OK' };
                    })
                        .catch(function (err) {
                        console.log(err);
                        if (err.data && err.data.message) {
                            return { status: 'error', message: err.data.message };
                        }
                        else {
                            return { status: 'error', message: err.status };
                        }
                    });
                };
                return RocksetDatasource;
            })();
            exports_1("default", RocksetDatasource);
        }
    }
});
//# sourceMappingURL=datasource.js.map