/// <reference path="../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />
export default class RocksetDatasource {
    private backendSrv;
    private templateSrv;
    private $q;
    apiKey: string;
    apiServer: string;
    backendsrv: any;
    headers: Object;
    id: number;
    name: string;
    url: string;
    /** @ngInject */
    constructor(instanceSettings: any, backendSrv: any, templateSrv: any, $q: any);
    parseTimeFromValue(value: any): any;
    createTimeSeriesData(value: Object, timeSeriesColName: string): Object[];
    createTableData(value: Object): Object;
    processQueryResult(values: Object[], displayTypes: string[], timeSeriesCols: string[]): {
        data: any[];
    };
    wrapSqlQuery(sqlQuery: string, timeSeriesCol: string, startTime: number, endTime: number, timeColType: string): string;
    parseQueries(options: any, timeSeriesCols: string[], timeColTypes: string[]): Object[];
    constructQueryRequests(queries: Object[]): any[];
    parseDisplayTypes(targets: Object[]): any[];
    parseTimeSeriesCols(targets: Object[]): string[];
    parseTimeColTypes(targets: Object[]): string[];
    query(options: any): any;
    annotationQuery(options: any): void;
    metricFindQuery(query: string): void;
    doRequest(options: any): any;
    testDatasource(): any;
}
