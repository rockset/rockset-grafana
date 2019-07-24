///<reference path="../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />

export class RocksetConfigCtrl {
  static templateUrl = 'partials/config.html';
  current: any;

  constructor($scope) {
    console.log($scope);
  }
}
