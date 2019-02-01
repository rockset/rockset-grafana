## Simple Rockset Datasource

## Compilation

mkdir ~/plugins
cd ~/plugins
git clone git@github.com:rockset/rockset-grafana.git
npm install && grunt

## Installation on your dev server
sudo docker-compose -f ~/plugins/rockset-grafana/grafana.yml up -d

## Shutdown the local instance
docker-compose -f ~/plugins/rockset-grafana/grafana.yml down
