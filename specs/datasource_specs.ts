import {describe, beforeEach, it, sinon, expect, angularMocks} from './lib/common';
import moment from 'moment';
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
    const firstDate = "2019-07-04T19:55:22.351000Z";
    const firstCount = 200;
    const secondCount = 300;
    const secondDate = "2019-07-04T19:55:22.351000Z";
    const response = {
      data: {
        column_fields: [
          {name: "?count", type: ""},
          {name: "?date", type: ""}
        ],
        results: [
          {"?count": firstCount, "?date": firstDate},
          {"?count": secondCount, "?date": secondDate}
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
        range: {
          from: moment(),
          to: moment()
        },
        targets: [{'target': 'SELECT _event_time, COUNT(*) FROM foo GROUP BY _event_time', 'timeseriesCol': '?date'}],
        timeseriesCol: '?date'
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
      const options = {
        headers: {},
        range: {
          from: moment(),
          to: moment()
        },
        targets: [{'target': 'SELECT * FROM foo', 'timeseriesCol': '?date'}, {'target': 'SELECT * FROM bar', 'timeseriesCol': '?date'}],
      };
      return ctx.ds.query(options).then(function(data) {
        expect(data.data.length).to.equal(2);
        expect(data.data[0].datapoints.length).to.equal(2);
        expect(data.data[1].datapoints.length).to.equal(2);
      });
    });

    it('should return success status for single table query', function() {
      const options = {
        headers: {},
        range: {
          from: moment(),
          to: moment()
        },
        targets: [{'target': 'SELECT * FROM foo', 'type': 'table'}],
      };
      return ctx.ds.query(options).then(function(data) {
        expect(data.data.length).to.equal(1);
        expect(data.data[0].type).to.equal('table');
        expect(data.data[0].rows[0][0]).to.equal(firstCount);
        expect(data.data[0].rows[0][1]).to.equal(firstDate);
        expect(data.data[0].rows[1][0]).to.equal(secondCount);
        expect(data.data[0].rows[1][1]).to.equal(secondDate);
      });
    });
    it('should return success status for multiple table query', function() {
      const options = {
        headers: {},
        range: {
          from: moment(),
          to: moment()
        },
        targets: [
          {'target': 'SELECT * FROM foo', 'type': 'table'},
          {'target': 'SELECT * FROM foo', 'type': 'table'}
        ],
      };
      return ctx.ds.query(options).then(function(data) {
        expect(data.data.length).to.equal(2);
        for (const datapoint of data.data) {
          expect(datapoint.rows[0][0]).to.equal(firstCount);
          expect(datapoint.rows[0][1]).to.equal(firstDate);
          expect(datapoint.rows[1][0]).to.equal(secondCount);
          expect(datapoint.rows[1][1]).to.equal(secondDate);
        }
      });
    });
  });
});
