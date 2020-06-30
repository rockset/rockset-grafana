import defaults from 'lodash/defaults';

import React, { ChangeEvent, PureComponent } from 'react';
import { LegacyForms, TextArea } from '@grafana/ui';
import { QueryEditorProps } from '@grafana/data';
import { DataSource } from './DataSource';
import { defaultQuery, RocksetDataSourceOptions, RocksetQuery } from './types';

const { FormField } = LegacyForms;

type Props = QueryEditorProps<DataSource, RocksetQuery, RocksetDataSourceOptions>;

export class QueryEditor extends PureComponent<Props> {
  onQueryTextChange = (event: any) => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, queryText: event.target.value as any });
    onRunQuery();
  };

  onQueryParamStartChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, queryParamStart: event.target.value });
    onRunQuery();
  };

  onQueryParamStopChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, queryParamStop: event.target.value });
    onRunQuery();
  };

  onQueryTimeFieldChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, queryTimeField: event.target.value });
    onRunQuery();
  };

  render() {
    const query = defaults(this.props.query, defaultQuery);
    const { queryText, queryParamStart, queryParamStop, queryTimeField } = query;

    return (
      <>
        <div className="gf-form">
          <FormField
            labelWidth={8}
            value={queryParamStart || ':startTime'}
            onChange={this.onQueryParamStartChange}
            label="Start"
            tooltip="Name of the query parameter for the start time"
          />
          <FormField
            labelWidth={8}
            value={queryParamStop || ':stopTime'}
            onChange={this.onQueryParamStopChange}
            label="Stop"
            tooltip="Name of the query parameter for the stop time"
          />
          <FormField
            labelWidth={8}
            value={queryTimeField || '_event_time'}
            onChange={this.onQueryTimeFieldChange}
            label="Time column"
            tooltip="Name of the column containing the time series"
          />
        </div>
        <div>
          <FormField
            labelWidth={8}
            label="Query Text"
            tooltip="Rockset SQL query to get the data. Must contain a WHERE clause which limits the query based on the startTime and stopTime."
            inputEl={<TextArea height={'100px'} value={queryText || ''} onChange={this.onQueryTextChange} />}
          />
        </div>
      </>
    );
  }
}
