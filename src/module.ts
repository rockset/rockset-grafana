import RocksetDatasource from './datasource';
import {RocksetQueryCtrl} from './query_ctrl';
import {RocksetConfigCtrl} from './config_ctrl';

class RocksetAnnotationsQueryCtrl {
  static templateUrl = 'partials/annotations.editor.html';
}

export {
  RocksetDatasource as Datasource,
  RocksetQueryCtrl as QueryCtrl,
  RocksetConfigCtrl as ConfigCtrl,
  RocksetAnnotationsQueryCtrl as AnnotationsQueryCtrl,
};
