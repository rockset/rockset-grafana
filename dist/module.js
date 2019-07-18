System.register(['./datasource', './query_ctrl', './config_ctrl'], function(exports_1) {
    var datasource_1, query_ctrl_1, config_ctrl_1;
    var ChangeMyNameAnnotationsQueryCtrl;
    return {
        setters:[
            function (datasource_1_1) {
                datasource_1 = datasource_1_1;
            },
            function (query_ctrl_1_1) {
                query_ctrl_1 = query_ctrl_1_1;
            },
            function (config_ctrl_1_1) {
                config_ctrl_1 = config_ctrl_1_1;
            }],
        execute: function() {
            ChangeMyNameAnnotationsQueryCtrl = (function () {
                function ChangeMyNameAnnotationsQueryCtrl() {
                }
                ChangeMyNameAnnotationsQueryCtrl.templateUrl = 'partials/annotations.editor.html';
                return ChangeMyNameAnnotationsQueryCtrl;
            })();
            exports_1("Datasource", datasource_1.default);
            exports_1("QueryCtrl", query_ctrl_1.ChangeMyNameQueryCtrl);
            exports_1("ConfigCtrl", config_ctrl_1.ChangeMyNameConfigCtrl);
            exports_1("AnnotationsQueryCtrl", ChangeMyNameAnnotationsQueryCtrl);
        }
    }
});
//# sourceMappingURL=module.js.map