///<reference path="../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />
System.register(['lodash', 'app/plugins/sdk', './css/query_editor.css!'], function(exports_1) {
    var __extends = (this && this.__extends) || function (d, b) {
        for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
    var lodash_1, sdk_1;
    var RocksetQueryCtrl;
    return {
        setters:[
            function (lodash_1_1) {
                lodash_1 = lodash_1_1;
            },
            function (sdk_1_1) {
                sdk_1 = sdk_1_1;
            },
            function (_1) {}],
        execute: function() {
            RocksetQueryCtrl = (function (_super) {
                __extends(RocksetQueryCtrl, _super);
                /** @ngInject **/
                function RocksetQueryCtrl($scope, $injector, templateSrv) {
                    _super.call(this, $scope, $injector);
                    this.templateSrv = templateSrv;
                    this.defaults = {};
                    this.debounce = null;
                    lodash_1.default.defaultsDeep(this.target, this.defaults);
                    this.target.target = this.target.target || '';
                    this.target.type = this.target.type || 'timeserie';
                    this.target.timeColType = this.target.timeColType || 'timestamp';
                    var _this = this;
                    this.debounce = lodash_1.default.debounce(function () {
                        _this.panelCtrl.refresh();
                    }, 1000);
                }
                RocksetQueryCtrl.prototype.getOptions = function (query) {
                    return this.datasource.metricFindQuery(query || '');
                };
                RocksetQueryCtrl.prototype.onChangeInternal = function () {
                    this.debounce.cancel();
                    this.debounce();
                    // this.panelCtrl.refresh(); // Asks the panel to refresh data.
                };
                RocksetQueryCtrl.templateUrl = 'partials/query.editor.html';
                return RocksetQueryCtrl;
            })(sdk_1.QueryCtrl);
            exports_1("RocksetQueryCtrl", RocksetQueryCtrl);
        }
    }
});
//# sourceMappingURL=query_ctrl.js.map