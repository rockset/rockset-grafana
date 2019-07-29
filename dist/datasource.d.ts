/// <reference path="../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />
export default class RocksetDatasource {
    private backendSrv;
    private templateSrv;
    private $q;
    apiKey: string;
    backendsrv: any;
    headers: Object;
    id: number;
    name: string;
    url: string;
    /** @ngInject */
    constructor(instanceSettings: any, backendSrv: any, templateSrv: any, $q: any);
    findTimeSeriesCol(value: Object): string;
    parseTimeFromValue(value: any): any;
    createTimeSeriesData(value: Object, timeSeriesColName: string): Object[];
    createTableData(value: Object): Object;
    processQueryResult(values: Object[], displayTypes: string[], timeSeriesCols: string[]): {
        data: any[];
    };
    parseQueries(targets: Object[]): Object[];
    constructQueryRequests(queries: Object[]): any[];
    parseDisplayTypes(targets: Object[]): any[];
    parseTimeSeriesCols(targets: Object[]): string[];
    query(options: any): any;
    annotationQuery(options: any): void;
    metricFindQuery(query: string): void;
    doRequest(options: any): any;
    testDatasource(): any;
}
