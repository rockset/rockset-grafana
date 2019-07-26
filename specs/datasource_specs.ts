import {describe, beforeEach, it, sinon, expect, angularMocks} from './lib/common';
import RocksetDatasource from '../src/datasource';
import TemplateSrvStub from './lib/template_srv_stub';
import Q from 'q';

describe('RocksetDatasource', function() {
  let ctx: any = {
    backendSrv: {},
    instanceSettings: {'jsonData': {'apiKey': ''}},
    templateSrv: new TemplateSrvStub()
  };

  beforeEach(function() {
    ctx.$q = Q;

    ctx.ds = new RocksetDatasource(ctx.instanceSettings, ctx.backendSrv, ctx.templateSrv, ctx.$q);
  });

  describe('When performing testDatasource', function() {
    describe('and an error is returned', function() {
      const error = {
        data: {
          error: {
            code: 'Error Code',
            message: `An error message.`
          }
        },
        status: 400,
        statusText: 'Bad Request'
      };

      beforeEach(function() {
        ctx.backendSrv.datasourceRequest = function(options) {
          return ctx.$q.reject(error);
        };
      });

      it('should return error status and a detailed error message', function() {
        return ctx.ds.testDatasource().then(function(results) {
          expect(results.status).to.equal('error');
          expect(results.message).to.equal(400);
        });
      });
    });

    describe('and the response works', function() {
      const response = {
        data: {
        },
        status: 200,
        statusText: 'OK'
      };

      beforeEach(function() {
        ctx.backendSrv.datasourceRequest = function(options) {
          return ctx.$q.when({data: response, status: 200});
        };
      });

      it('should return success status', function() {
        return ctx.ds.testDatasource().then(function(results) {
          expect(results.status).to.equal('success');
        });
      });
    });
  });

  describe('When performing query', function() {
    const response = {
      data: {
        column_fields: [
          {name: "?count", type: ""},
          {name: "?date", type: ""}
        ],
        results: [
          {"?count": 200, "?date": "2019-07-04T19:55:22.351000Z"},
          {"?count": 300, "?date": "2019-07-04T19:55:22.351000Z"}
        ]
      },
      status: 200,
      statusText: 'OK'
    };

    const options = {
      headers: {},
      targets: [{'target': 'SELECT * FROM foo'}, {'target': 'SELECT * FROM bar'}],
    };

    beforeEach(function() {
      ctx.backendSrv.datasourceRequest = function(options) {
        return ctx.$q.when(response);
      };
    });

    it('should return no data when no query', function() {
      const options = {
        headers: {},
        targets: [{'target': ''}],
      };
      ctx.backendSrv.datasourceRequest = function(options) {
        return ctx.$q.when(response);
      };
      return ctx.ds.query(options).then(function(data) {
        expect(data.data.length).to.equal(0);
      });
    });

    it('should return success status for single query', function() {
      const options = {
        headers: {},
        targets: [{'target': 'SELECT * FROM foo'}],
      };
      ctx.backendSrv.datasourceRequest = function(options) {
        return ctx.$q.when(response);
      };
      return ctx.ds.query(options).then(function(data) {
        expect(data.data.length).to.equal(1);
        expect(data.data[0].datapoints.length).to.equal(2);
      });
    });

    it('should return success status for many queries', function() {
      return ctx.ds.query(options).then(function(data) {
        expect(data.data.length).to.equal(2);
        expect(data.data[0].datapoints.length).to.equal(2);
        expect(data.data[1].datapoints.length).to.equal(2);
      });
    });
  });
});
