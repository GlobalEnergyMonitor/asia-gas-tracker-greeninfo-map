# Asia Gas Tracker

Project with [GEM](globalenergymonitor.org), based largely on [Latin America Gas Tracker](https://greeninfo-network.github.io/latin-america-gas-tracker), with different types categories, and improvements adopted from [GCIT](https://greeninfo-network.github.io/global-coal-infrastructure-tracker/)

## Hosting

On GEM via iFrame, served from GH pages
https://greeninfo-network.github.io/asia-gas-tracker


## Development

Pre-requisites: 
* Node and npm
* Yarn

To match the development node version:
```
nvm use
```

First time only:
```
npm install
```

To start a development server:
```
npm run start
```


## Production
```
npm run build
```

The app is hosted on GitHub pages (via the `docs/` folder).

## Data Management

There are several data sources
* Country boundaries (see the `documentation/update_country_geojson` directory for details)
* A single Google spreadhsheet is used to manage pipeline and terminal data. Currently these are combined directly in Sheets for export from a single tab named `data_export`
https://docs.google.com/spreadsheets/d/1ZaC5XCNSfM603Hxsi0vtGcADOPQzY5BEOi6cbxnclw0/edit


## Data formatting

* Terminals are simply parsed from `lat` and `lng` columns in the csv data sheet.
* Pipelines, however, use a custom-delimeneted format for lines in the `route` column. Segments are delimited with semi-colons, and coordinate pairs are separated by colons. The coordinates themselves are separated by a comma:   
```
-33.5020763,147.7848194:-33.385745,148.006048:-33.136884,148.171628:-32.2378573,148.2389384:-32.2241903,148.6155634:-32.548010, 148.936829
```

## Data update

1. GEM will send us a raw data spreadsheet. After checking that column order hasn't changed, drop this in the `raw_data` tab on [this spreadsheet](https://docs.google.com/spreadsheets/d/1ZaC5XCNSfM603Hxsi0vtGcADOPQzY5BEOi6cbxnclw0/edit) and then export the `data_export` tab to `data/data.csv`
2. Then see `documentation/update_country_geojson/readme.md` for details on matching up country names in the data to country names in `world.json` to produce `data/countries.json`

NOTE: They only want a limited subset of countries to show here. So arguably you could just run the following. But this won't account for countries that may get added in the future.
```bash
ogr2ogr -f geojson -dialect sqlite -sql "select * from world where NAME in ('Bangladesh', 'Brunei', 'Cambodia', 'China', 'Hong Kong', 'India', 'Indonesia', 'Japan', 'Malaysia', 'Mongolia', 'Myanmar', 'Nepal', 'North Korea', 'Pakistan', 'Philippines', 'Singapore', 'South Korea', 'Sri Lanka', 'Taiwan', 'Thailand', 'Timor-Leste', 'Vietnam')" countries.json world.json -lco COORDINATE_PRECISION=3 -simplify 0.009
```

Note:
- Watch for changing values in the `type` field in data.csv. These must match (spelling and case) the values in `CONFIG.fossil_types`, but often there are slight changes (singular vs plural, upper case vs. lower case)

## Testing new data

1. After every data update, there are often pipelines that won't correctly parse. Check the console for any error messages, then email the client the names of any pipelines that need work. 
