# Using Rockset from Grafana

## Requirements

You will need to create an account and add a Rockset API key from The [Rockset console](`https://console.rockset.com/apikeys#`)

## Queries

To query your Rockset collections and access the data in Grafana, simply write your SQL query into the provided
text area after selecting Rockset as a datasource.

![query editor](https://github.com/rockset/rockset-grafana/blob/master/src/img/rockset_query.png)

## Troubleshooting

If you have any problems or suggestions please contact support@rockset.com

## Developing on this Plugin

1. Make a subdirectory named after your plugin in the `data/plugins` subdirectory in your Grafana instance. It does not really matter what the directory name is. When the plugin is installed via the grafana cli, it will create a directory named after the plugin id field in the plugin.json file.

1. Copy the files in this project into your new plugin subdirectory.
2. `npm install` or `yarn install`
3. `grunt`
4. `karma start --single-run` to run the tests once. There is one failing test for the `testDatasource` in the datasource.ts file.
5. Restart your Grafana server to start using the plugin in Grafana (Grafana only needs to be restarted once).

`grunt watch` will build the TypeScript files and copy everything to the dist directory automatically when a file changes. This is useful for when working on the code. `karma start` will turn on the karma file watcher so that it reruns all the tests automatically when a file changes.

Changes should be made in the `src` directory. The build task transpiles the TypeScript code into JavaScript and copies it to the `dist` directory. Grafana will load the JavaScript from the `dist` directory and ignore the `src` directory.
