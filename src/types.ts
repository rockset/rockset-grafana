import { DataQuery, DataSourceJsonData } from '@grafana/data';

export interface RocksetQuery extends DataQuery {
  queryText?: string;
  queryParamStart: string;
  queryParamStop: string;
  queryTimeField: string;
}

export const defaultQuery: Partial<RocksetQuery> = {
  // TODO(pme) should there be a default query?
  queryParamStart: ':start',
  queryParamStop: ':stop',
  queryTimeField: '_event_time',
};

/**
 * These are options configured for each DataSource instance
 */
export interface RocksetDataSourceOptions extends DataSourceJsonData {
  server?: string;
}

/**
 * Value that is used in the backend, but never sent over HTTP to the frontend
 */
export interface RocksetSecureJsonData {
  apiKey?: string;
}
