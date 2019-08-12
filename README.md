# Using Rockset from Grafana

## Requirements

You will need to create an account and add a Rockset API key from `https://console.rockset.com/apikeys#`

## Setup
use the grafana-cli to install your plugin. You can download the rockset plugin by using the command `grafana-cli --pluginUrl https://github.com/rockset/rockset-grafana/archive/<LATEST_RELEASE>.zip plugins install rockset-grafana .` where LATEST_RELEASE is the most recent release from this repository.

## Queries

To query your Rockset collections and access the data in Grafana, simply write your SQL query into the provided
text area after selecting Rockset as a datasource.

![query editor](https://github.com/rockset/rockset-grafana/blob/master/src/img/rockset_query.png)

## Troubleshooting

If you have any problems or suggestions please contact support@rockset.com


Complete documentation located at
https://docs.rockset.com/grafana/
