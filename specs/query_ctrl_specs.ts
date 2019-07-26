import {describe, beforeEach, it, sinon, expect} from './lib/common';
import {RocksetQueryCtrl} from '../src/query_ctrl';
import TemplateSrvStub from './lib/template_srv_stub';
import Q from 'q';

describe('RocksetQueryCtrl', function() {
  let queryCtrl;

  beforeEach(function() {
    queryCtrl = new RocksetQueryCtrl({}, {}, new TemplateSrvStub());
    queryCtrl.datasource = {$q: Q};
  });

  describe('init query_ctrl variables', function() {
    it('query should be initialized to blank string', function() {
      // Replace with test for defaults that should be set in the query ctrl.
      expect(queryCtrl.target.target).to.be('');
    });
  });

  describe('init query_ctrl variables', function() {
    it('query data type should be initalized to timeserie', function() {
      // Replace with test for defaults that should be set in the query ctrl.
      expect(queryCtrl.target.type).to.be('timeserie');
    });
  });
});
