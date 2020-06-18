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
            value={queryParamStart || ':start'}
            onChange={this.onQueryParamStartChange}
            label="Start"
            tooltip="Name of the query parameter for the start value"
          />
          <FormField
            labelWidth={8}
            value={queryParamStop || ':stop'}
            onChange={this.onQueryParamStopChange}
            label="Stop"
            tooltip="Name of the query parameter for the stop value"
          />
          <FormField
            labelWidth={8}
            value={queryTimeField || '_event_time'}
            onChange={this.onQueryTimeFieldChange}
            label="Time"
            tooltip="Name time column"
          />
        </div>
        <div>
          <FormField
            labelWidth={8}
            label="Query Text"
            tooltip="Rockset SQL"
            inputEl={<TextArea value={queryText || ''} onChange={this.onQueryTextChange} />}
          />
        </div>
      </>
    );
  }
}
