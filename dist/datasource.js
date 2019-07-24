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
                    this.apiKey = instanceSettings.jsonData['apiKey'];
                    this.id = instanceSettings.id;
                }
                RocksetDatasource.prototype.query = function (options) {
                    throw new Error("Query Support not implemented yet.");
                };
                RocksetDatasource.prototype.annotationQuery = function (options) {
                    throw new Error("Annotation Support not implemented yet.");
                };
                RocksetDatasource.prototype.metricFindQuery = function (query) {
                    throw new Error("Template Variable Support not implemented yet.");
                };
                RocksetDatasource.prototype.testDatasource = function () {
                    console.log(this);
                    return this.$q.when({
                        status: 'error',
                        message: 'Data Source is just a template and has not been implemented yet.',
                        title: 'Error'
                    });
                };
                return RocksetDatasource;
            })();
            exports_1("default", RocksetDatasource);
        }
    }
});
//# sourceMappingURL=datasource.js.map