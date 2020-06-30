import { DataQuery, DataSourceJsonData } from '@grafana/data';

export interface RocksetQuery extends DataQuery {
  queryText?: string;
  queryParamStart: string;
  queryParamStop: string;
  queryTimeField: string;
  queryValueField: string;
}

export const defaultQuery: Partial<RocksetQuery> = {
  queryText: `SELECT
    TIME_BUCKET(HOURS(1), _events._event_time) AS _event_time,
    count(_events.type) AS value
FROM
    commons._events
WHERE
    _events._event_time > :startTime AND
    _events._event_time < :stopTime
GROUP BY
    bucket
ORDER BY
    bucket`,
  queryParamStart: ':startTime',
  queryParamStop: ':stopTime',
  queryTimeField: '_event_time',
  queryValueField: 'value',
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
