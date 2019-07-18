///<reference path="../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />
System.register([], function(exports_1) {
    var ChangeMyNameDatasource;
    return {
        setters:[],
        execute: function() {
            ChangeMyNameDatasource = (function () {
                /** @ngInject */
                function ChangeMyNameDatasource(instanceSettings, backendSrv, templateSrv, $q) {
                    this.backendSrv = backendSrv;
                    this.templateSrv = templateSrv;
                    this.$q = $q;
                    this.name = instanceSettings.name;
                    this.id = instanceSettings.id;
                }
                ChangeMyNameDatasource.prototype.query = function (options) {
                    throw new Error("Query Support not implemented yet.");
                };
                ChangeMyNameDatasource.prototype.annotationQuery = function (options) {
                    throw new Error("Annotation Support not implemented yet.");
                };
                ChangeMyNameDatasource.prototype.metricFindQuery = function (query) {
                    throw new Error("Template Variable Support not implemented yet.");
                };
                ChangeMyNameDatasource.prototype.testDatasource = function () {
                    return this.$q.when({
                        status: 'error',
                        message: 'Data Source is just a template and has not been implemented yet.',
                        title: 'Error'
                    });
                };
                return ChangeMyNameDatasource;
            })();
            exports_1("default", ChangeMyNameDatasource);
        }
    }
});
//# sourceMappingURL=datasource.js.map