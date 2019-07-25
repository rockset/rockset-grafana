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
                RocksetDatasource.prototype.createTimeSeriesData = function (value) {
                    return {
                        "target": "upper_75",
                        "datapoints": [
                            [622, 1450754160000],
                            [365, 1450754220000]
                        ]
                    };
                };
                RocksetDatasource.prototype.createTableData = function (value) {
                    var columns = [];
                    var rows = [];
                    var columnInfo = value['data']['column_fields'];
                    var resultValues = value['data']['results'];
                    var columnNames = [];
                    for (var colIdx = 0; colIdx < columnInfo.length; colIdx += 1) {
                        var colInfo = columnInfo[colIdx];
                        columnNames.push(colInfo['name']);
                        columns.push({ "text": colInfo['name'], "type": colInfo['type'] });
                    }
                    for (var valIdx = 0; valIdx < resultValues.length; valIdx += 1) {
                        var rowValues = resultValues[valIdx];
                        var row = [];
                        for (var colNameIdx = 0; colNameIdx < columnNames.length; colNameIdx += 1) {
                            var columnName = columnNames[colNameIdx];
                            row.push(rowValues[columnName]);
                        }
                        rows.push(row);
                    }
                    var data = {
                        "columns": columns,
                        "rows": rows,
                        "type": "table"
                    };
                    return data;
                };
                RocksetDatasource.prototype.processQueryResult = function (values, displayTypes) {
                    var data = [];
                    for (var valueIdx = 0; valueIdx < values.length; valueIdx += 1) {
                        var value = values[valueIdx];
                        if (displayTypes[valueIdx] === 'table') {
                            data.push(this.createTableData(value));
                        }
                        else {
                            data.push(this.createTimeSeriesData(value));
                        }
                    }
                    console.log("data is", data);
                    return { data: data };
                };
                RocksetDatasource.prototype.parseQueries = function (targets) {
                    var queries = [];
                    for (var idx = 0; idx < targets.length; idx += 1) {
                        var queryInfo = targets[idx];
                        var queryObject = {};
                        queryObject['sql'] = {};
                        var sqlQuery = queryInfo['target'];
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
                    for (var idx = 0; idx < queries.length; idx += 1) {
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
                RocksetDatasource.prototype.parseDisplayTypes = function (targets) {
                    return targets.map(function (target) { return target['type']; });
                };
                RocksetDatasource.prototype.query = function (options) {
                    var _this = this;
                    var queries = this.parseQueries(options.targets);
                    if (queries.length === 0) {
                        return this.$q.when({ data: [] });
                    }
                    var reqs = this.constructQueryRequests(queries);
                    var displayTypes = this.parseDisplayTypes(options.targets);
                    return Promise.all(reqs).then(function (res) {
                        return _this.processQueryResult(res, displayTypes);
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