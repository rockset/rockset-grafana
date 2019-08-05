///<reference path="../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />

import _ from 'lodash';
import {QueryCtrl} from 'app/plugins/sdk';
import './css/query_editor.css!';

export class RocksetQueryCtrl extends QueryCtrl {
  static templateUrl = 'partials/query.editor.html';

  defaults = {
  };
  debounce = null;

  /** @ngInject **/
  constructor($scope, $injector, private templateSrv) {
    super($scope, $injector);

    _.defaultsDeep(this.target, this.defaults);
    this.target.target = this.target.target || '';
    this.target.type = this.target.type || 'timeserie';
    this.target.timeColType = this.target.timeColType || 'timestamp';
    const _this = this;
    this.debounce = _.debounce(function() {
      _this.panelCtrl.refresh();
    }, 1000);
  }

  getOptions(query) {
    return this.datasource.metricFindQuery(query || '');
  }

  onChangeInternal() {
    this.debounce.cancel();
    this.debounce();
    // this.panelCtrl.refresh(); // Asks the panel to refresh data.
  }
}
