///////////////////////////////////////////////////////////////////////////////////////////////////////////
// IMPORTS
///////////////////////////////////////////////////////////////////////////////////////////////////////////
import MobileDetect from 'mobile-detect';
import * as JsSearch from 'js-search';

import './modules/leaflet-back-button.css';
import LeafletBackButton from './modules/leaflet-back-button';

import './modules/leaflet-control-basemapbar.css';
import LeafletBasemapBar from './modules/leaflet-control-basemapbar';

import './modules/leaflet-control-zoombar.css';
import LeafletZoomBar from './modules/leaflet-control-zoombar';

///////////////////////////////////////////////////////////////////////////////////
// STYLES, in production, these will be written to <script> tags
///////////////////////////////////////////////////////////////////////////////////
import './loading.css';
import './glyphicons/css/glyphicons.css';
import styles from './index.scss';

///////////////////////////////////////////////////////////////////////////////////////////////////////////
// GLOBAL VARIABLES & STRUCTURES
///////////////////////////////////////////////////////////////////////////////////////////////////////////
// global config
const CONFIG = {};
const DATA = {};

// specify which basemap will be on by default, and when the map is reset by the 'Home' button
CONFIG.default_basemap = 'map';

// default title for results
CONFIG.default_title = 'Asia';

// default tilte for the thing we are mapping
CONFIG.fossil_name = 'gas project';

// minzoom and maxzoom for the map
CONFIG.minzoom = 2;
CONFIG.maxzoom = 15;

// custom extent, an attempt to focus on the "core area"
// CONFIG.homebounds = [[47.5, 177.27],[-4.85, 21.8]];
CONFIG.defaultLat = 23.885;
CONFIG.defaultLng = 99.514;
CONFIG.defaultZoom = 5;

// currently selected tab, defaults to map
CONFIG.visible_tab = 'map';

// Style definitions (see also scss exports, which are imported here as styles{})
// style for highlighting countries on hover and click
CONFIG.country_hover_style    = { stroke: 3, color: '#1267a5', opacity: 0.6, fill: '#fff', fillOpacity: 0 };
CONFIG.country_selected_style = { stroke: 3, color: '#1267a5', opacity: 1, fill: false, fillOpacity: 0 };
// an "invisible" country style, as we don't want countries to show except on hover or click
CONFIG.country_no_style = { opacity: 0, fillOpacity: 0 };

// feature highlight styles, shows below features on hover or click
CONFIG.feature_hover_style  = { color: '#fff5a3', fillOpacity: 1, stroke: 13, weight: 13, opacity: 1 };
CONFIG.feature_select_style = { color: '#f2e360', fillOpacity: 1, stroke: 13, weight: 13, opacity: 1 };

// Define the attributes used in the DataTable and map popup
// name: formatted label for presentation
// format: data type, for format function in CONFIG.format
// classname: used in DataTables <th>
CONFIG.attributes = {
  'project': {name: 'Project Name', format: 'string', classname: 'project', search: true, table: true, popup: true},
  'type': {name: 'Type', format: 'string', classname: 'type', search: false, table: true, popup: true},
  'unit': {name: 'Unit', format: 'string', classname: 'unit', search: false, table: true, popup: true},
  'owner': {name: 'Owner', format: 'string', classname: 'owner', search: true, table: true, popup: true},
  'parent': {name: 'Parent', format: 'string', classname: 'parent', search: true, table: true, popup: true},
  'countries': {name: 'Countries', format: 'string', classname: 'country', search: true, table: true, popup: true},
  'status_tabular': {name: 'Status', format: 'string', classname: 'status', search: false, table: true, popup: true},
  'status': {name: 'Status', format: 'string', classname: 'status', search: false, table: false, popup: false},
  'url': {name: 'Wiki page', format: 'string', search: false, table: false, popup: false},
  'capacity': {name: 'Capacity', format: 'variable_float', classname: 'capacity', search: false, table: true, popup: true},
  'production': {name: 'Production', format: 'variable_float', classname: 'production', table: true, popup: true},
  'units': {name: 'Capacity or Production units', format: 'string', classname: 'units', search: false, table: true, popup: false, tooltip: 'MTPA (million tons per annum), boe/y: barrels of oil equivalent per year'},
  'start_year': {name: 'Start Year', format: 'string', classname: 'start_unit', search: false, table: true, popup: true},
};

// break the map modal/popup into two cols with this many rows in each column
CONFIG.number_of_rows_per_popup_column = 5;

CONFIG.format = {
  // return as is
  'string': function(s) { return s },
  // string to number with 0 decimals
  'number': function(n) {
    return parseFloat(n).toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0});
  },
  // string to float with two decimals
  'float': function(n) {
    return parseFloat(n).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  },
  // string to number with as many output decimals as input
  'variable_float': function(n) {
    if (isNaN(n)) return n;
    let num = Math.round((+n + Number.EPSILON) * 100) / 100; 
    if (num < 11) {
      return parseFloat(num).toLocaleString('en-US');
    } else {
      return parseFloat(num).toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0}); 
    }
  },
  // if entered value is NaN, then return it, otherwise same as number, above
  'mixed':  function(m) { return isNaN(m) ? m : CONFIG.format['number'](m) },
}

// the Universe of status types: these are the categories used to symbolize coal plants on the map
//          key: allowed status names, matching those used in DATA.fossil_data
//          text: human readible display
//          color: imported from CSS
CONFIG.status_types = {
  'operating': {text: 'Operating', cssclass: 'status1', color: styles.status1, order: 1 },
  'construction_plus': {text: 'Construction / In development', cssclass: 'status2', color: styles.status2, order: 2 },
  'pre-construction': {text: 'Pre-construction', cssclass: 'status3', color: styles.status2, order: 3},
  'proposed_plus': {text: 'Proposed / Announced / Discovered', cssclass: 'status4', color: styles.status4, order: 4 },
  'cancelled': {text: 'Cancelled', cssclass: 'status5', color: styles.status5, order: 5 },
  'shelved': {text: 'Shelved', cssclass: 'status6', color: styles.status6, order: 6 },
  'retired': {text: 'Retired', cssclass: 'status7', color: styles.status7, order: 7 },
  'mothballed_plus': {text: 'Mothballed / Idle / Shut in', cssclass: 'status8', color: styles.status8, order: 8 },
};

// A second set of status type definitions for the table and map popups
// Here we do not combine categories, but instead show them separately
CONFIG.status_types_tabular = {
  'operating': {text: 'Operating'},
  'discovered': {text: 'Discovered'},
  'announced': {text: 'Announced'},
  'in-development': {text: 'In Development'},
  'shut-in': {text: 'Shut In'},
  'proposed': {text: 'Proposed'},
  'construction': {text: 'Construction'},
  'pre-construction': {text: 'Pre-construction'},
  'cancelled': {text: 'Cancelled'},
  'shelved': {text: 'Shelved'},
  'retired': {text: 'Retired'},
  'mothballed': {text: 'Mothballed'},
  'idle': {text: 'Idle'},
};

// Note: prunecluster.markercluster.js needs this, and I have not found a better way to provide it
CONFIG.markercluster_colors = Object.keys(CONFIG.status_types).map(function(v) { return CONFIG.status_types[v].color });

// Fossil types: The types of projects. These will form a second set of checkboxes on the map
// TODO: remove "symbol" which is not used
CONFIG.fossil_types = {
  // points
  'lng_terminal': {text: 'LNG Terminal', shape: 'square', order: 1},
  'gas_power_plant': {text: 'Gas Power Plant', shape: 'circle', order: 2},
  'gas_extraction_area':  {text: 'Gas Extraction Area', shape: 'triangle', order: 3},
  // lines
  'gas_pipeline': {text: 'Gas Pipeline', shape: 'line', order: 4},
}

// false until the app is fully loaded
CONFIG.first_load = true;

// to track when/if to refresh the table, to save cycles refreshing it when not visible
CONFIG.refresh_table = true;

///////////////////////////////////////////////////////////////////////////////////////////////////////////
///// INITIALIZATION: these functions are called when the page is ready,
///////////////////////////////////////////////////////////////////////////////////////////////////////////
$(document).ready(function () {
  // data initialization first, then the remaining init steps
  Promise.all([
    initData('./static/data/data.csv'), 
    initData('./static/data/countries.json')])
    .then(function(data) {
      initDataFormat(data)    // get data ready for use
      initButtons();          // init button listeners
      initTabs();             // init the main navigation tabs
      initSearch();           // init the full text search, and the search input behavior
      initTable();            // init the Data Table
      initMap();              // regular leaflet map setup
      initMapLayers();        // init some map layers and map feature styles
      initMapControls();      // initialize the layer pickers, etc.
      initPruneCluster();     // init the "prune cluster" library
      initState();            // init app state. This is the app "entry point"

console.log(DATA);
console.log(CONFIG);

    }); // Promise.then()

    // initialize a resize handler
    $(window).on('resize', resize );
});

// resize everything: map, content divs, table
function resize() {
  // calculate the content height for this window:
  // 42px for the nav bar, 10px top #map, 10px top of #container = 42 + 20 + 10
  const winheight = $(window).height();
  let height = winheight - 54;

  // resize the map
  $('div#map').height(height - 8);
  CONFIG.map.invalidateSize();

  // resize the content divs to this same height
  $('div.content').height(height);

  // resize the table body: note it never seems to get past here, if scrollY is false
  const tablediv = $('.dataTables_scrollBody');
  if (!tablediv.length) return;
  
  // differential sizing depending on if there is a horizontal scrollbar or not
  let factor = 300; // seems to work well across screen widths
  if (tablediv.hasHorizontalScrollBar()) factor += 10;
  let bodyheight = $('body').height() - factor;
  // set the scrollbody height via css property
  tablediv.css('height', bodyheight);
  CONFIG.table.columns.adjust().draw();
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////
///// FUNCTIONS CALLED ON DOC READY
///////////////////////////////////////////////////////////////////////////////////////////////////////////

// Basic data init, returns a promise
function initData(url) {
  // wrap this in a promise, so we know we have it before continuing on to remaining initialize steps
  return new Promise(function(resolve, reject) {
    $.get(url, function(data) {
      resolve(data);
    });
  });
}

// Data formatting routines, to get the static, raw data files into the form we need it in
function initDataFormat(data) {
  // set country data equal to the second data object from the initData() Promise()
  DATA.country_data = data[1];

  // get the list of valid statuses, for data checks, below
  let statuses = Object.keys(CONFIG.status_types);

  // format the "tracker" point and line data
  // 1) parse raw JSON from CSV
  var json = Papa.parse(data[0], {header: true, skipEmptyLines: 'greedy'});

  // 2) create stubs for geojson files, one for terminals, one for pipelines
  let geojson = {};
  geojson['type'] = 'FeatureCollection';
  geojson['features'] = [];

  // 3) iterate over raw json to extract geometry and props for GeoJSON
  json.data.forEach(function(row,i) {
    // Initial check: skip rows with invalid status
    if (statuses.indexOf(row.status) < 0) {
      console.log(`Error: ${row.project} has invalid status type: ${row.status}`);
      return;
    }

    // stub out a feature, and coords
    let feature = {
      "type": "Feature",
      "geometry": {},
      "properties": {},
      // This is not well documented, but js-search requires a unique ID for indexing
      // see initSearch()
      id: i,
    };
    let coordinates = [];
    let type;

    // track error condition
    let error = false;
    // Geometry: different for pipelines/terminals
    // only pipelines have a defined route
    if (row.route) {
      // step 1: some of these have a pipe-delimited "center", which we don't need
      let route = row.route.split('|')[0];
      // step 2: segments are semi-colon delimited
      let segments = route.split(';');
      type = segments.length > 1 ? "MultiLineString" : "LineString";
      // within segments are the coords themselves
      segments.forEach(function(segment) {
        let pairs = segment.split(':');
        let line = [];
        pairs.forEach(function(pair) {
          let coords = pair.split(',');
          // coords are in lat, long (y, x) format, and need to be flipped for GeoJSON
          if ( isNaN(parseFloat(coords[1])) || isNaN(parseFloat(coords[0])) ) {
           error = true;
           console.log(`Error: ${row.project} has invalid route`);
          }
          line.push([ parseFloat(coords[1]), parseFloat(coords[0]) ]);
        });
        segments.length > 1 ? coordinates.push(line) : coordinates = line;
      });
    } else {
      // no row.route: we likely have a point

      // validate lat/lng
      if (isNaN(parseFloat(row.lat)) || isNaN(parseFloat(row.lng))) {
        error = true;
        console.log(`Error: ${row.project} invalid latitude and/or longitude`);
      }

      if (!row.lat || !row.lng) {
        error = true;
        console.log(`Error: ${row.project} missing latitude and/or longitude`);
      } 

      type = "Point";
      coordinates[0] = parseFloat(row.lng);
      coordinates[1] = parseFloat(row.lat);
    }

    // all done setting up coordinates, add to the feature
    feature.geometry.type = type;
    feature.geometry.coordinates = coordinates;

    // Properties: Add these from the keys defined in CONFIG.attributes. These will be the same for pipelines/terminals
    let props = Object.keys(CONFIG.attributes);

    props.forEach(function(property) {
      let thisprop = row[property];
      // formatting and special cases
      if (property == 'country') thisprop = formatCountryList(thisprop); 

      if (property == 'id') thisprop = feature.id; // use the same id set at feature level for search

      // the default case: property = thisprop, which is simply row[property]
      feature.properties[property] = thisprop;
    });

    // all set with this feature, if there were no errors, push it to geojson
    if (!error) geojson['features'].push(feature);

  });

  // Final step: keep a reference to this geojson in DATA
  DATA.rawdata = geojson;
  DATA.filtered = geojson.features;
}

// take our oddly formatted country lists and normalize it, standardize it
// DANGER this all assumes no country names that themselves include a comma, which we don't have now, but may some day
// NOTE "countries" lists no longer include dashes, but leaving this as-is, for potential future compatibility
function formatCountryList(countries) {
  // first split the incoming list by the two delimeters used in the raw data, '-' and ','
  var list = countries.split(/,|-/);
  list = uniq(list);
  // and return the normalized list as a comma-delimited string
  return list.join(', ');
}


// init state from params, or not
function initState() {
  // check for params, and if found, use them to update the view
  let params = new URLSearchParams(window.location.search);
  // check if the params object has anything in it
  if (params.toString()) {
    drawTable(DATA.filtered);
    setStateFromParams(params);
    completeFinalInitSteps(false);
  } else {
    // no params, carry on as usual
    drawMap();
    updateResultsPanel();
    completeFinalInitSteps(true);
  }
}

// a set of final init steps, whether or not loading from params
function completeFinalInitSteps(fitmap=false) {
  setTimeout(function() {
    resize();
    if (fitmap) CONFIG.map.setView([CONFIG.defaultLat, CONFIG.defaultLng], CONFIG.defaultZoom);
    $('div#loading').hide();
    CONFIG.first_load = false;
  }, 750);
}

function setStateFromParams(params) {
  // parse status params
  if (params.has('status')) {
    // get the checkboxes and clear them all
    let checks = $('div#status-types input').prop('checked', false);
    // gather all the checked statuses from the params
    let statuses = params.get('status').split(',');

    // check those that were specified in the params
    statuses.forEach(function(value) {
      $(`div#status-types input[value="${value}"]`).prop('checked', true);
    });
  }

  // parse type params
  if (params.has('type')) {
    // get the checkboxes and clear them all
    let checks = $('div#fossil-types input').prop('checked', false);
    // gather all the checked statuses from the params
    let types = params.get('type').split(',');

    // check those that were specified in the params
    types.forEach(function(value) {
      $(`div#fossil-types input[value="${value}"]`).prop('checked', true);
    });
  }

  if (params.has('status') || params.has('type')) {
    // trigger change on one layer checkbox. It doesn't matter which one
    $('div#status-types input').first().trigger('change');
  }

  // parse basemapmap param
  if (params.has('basemap')) {
    let basemap = params.get('basemap');
    CONFIG.basemap_control.selectLayer(basemap);
  }

  // parse country param
  if (params.has('country')) {
    // parse the country param, to Title Case
    let countryname = params.get('country')
    countryname = countryname.toTitleCase();

    // find the matching feature for the map
    let feature;
    DATA.country_data.features.forEach(function(f) {
      if (f.properties['NAME'] == countryname) {
        feature = f;
        return;
      }
    })

    // highlight it on the map and update the result panel
    CONFIG.selected_country.name = countryname;
    CONFIG.selected_country.layer.addData(feature);
    updateResultsPanel(countryname, true);
  }

  // parse view params
  if (params.has('view')) {
    let view = params.get('view');
    let views = view.split(',');
    CONFIG.map.setView([views[0],views[1]],views[2]);
  }

  // parse the search params
  // do this last, as it makes the most UI changes
  if (params.has('search')) {
    let search = params.get('search');
    // simply submitting this should do and update everything
    $('input#search').val(search).submit();
  }
}

// the inverse of setStateFromParams: update the params on the address bar based on user interactions
function updateStateParams() {
  if (CONFIG.first_load) return;
  // get the current search params
  let params = new URLSearchParams(window.location.search);

  // set the view param
  let zoom   = CONFIG.map.getZoom();
  let center = CONFIG.map.getCenter();
  let view = `${center.lat.toPrecision(8)},${center.lng.toPrecision(8)},${zoom}`;
  params.delete('view');
  params.append('view', view);

  // set a param for selected country
  // this one we want to explicity clear if it gets "unselected", so always start with delete
  params.delete('country');
  if (CONFIG.selected_country && CONFIG.selected_country.name) {
    params.append('country', CONFIG.selected_country.name);
  }

  // set a param for selected status
  let statuses = $('div#status-types input:checked').map(function(){
    return $(this).val();
  }).get();
  if (statuses.length) {
    params.delete('status');
    params.append('status', statuses);
  }

  // set a param for selected fuel type
  let types = $('div#fossil-types input:checked').map(function(){
    return $(this).val();
  }).get();
  if (types.length) {
    params.delete('type');
    params.append('type', types);
  }

  // set a basemap param
  let basemap = $('div.leaflet-control-basemapbar-option-active').data().layer;
  if (basemap) {
    params.delete('basemap');
    params.append('basemap', basemap);
  }

  // set a search term param
  params.delete('search'); // always delete, this handles the case where the search input is cleared
  let search = $('input#search').val(); 
  if (search) {
    params.append('search', search);
  }

  // all set! if we have anything, parse the string, make it a query and
  // replace state in our local address bar
  let searchstring = decodeURIComponent(params.toString());
  if (searchstring) {
    params = '?' + searchstring;
    window.history.replaceState(params, '', params);
  }

  // final step: Let the iframe know the new params
  // so we can get this on the address bar of the parent page
  parent.postMessage(params, '*');
}

function initButtons() {
  // "home" button that resets the map
  $('div a#home-button').on('click', function(){
    resetTheMap();
  });

  // close button, generically closes it's direct parent
  $('button.close').on('click', function() { $(this).parent().hide(); });

  // init the layer icon control to open the legend
  $('#layers-icon').on('click', function() { $('div.layer-control').show(); });

  // init the menu icon to open the "results" panel
  $('div#results-icon').on('click', function() { $('div#country-results').show(); });

  // the clear search button, clears the search inputs on the map and table
  $('div.searchwrapper a.clear-search').on('click', function() {
    clearSearch();
  });

  // select all/clear all "buttons" by status and type
  $('div#layer-control-clear span#select-all').on('click', function(e) {
    let type = $(this).data().type;
    $(`div#${type}-types input:not(:checked)`).each(function(c) { $(this).click() });
    return false;
  });
  $('div#layer-control-clear span#clear-all').on('click', function(e) {
    let type = $(this).data().type;
    $(`div#${type}-types input:checked`).each(function(c) { $(this).click() });
    return false;
  });

  // zoom to button on reesults panel, delegated click handler
  $('body').on('click', 'a.zoomto', function() {
    zoomToResults();
  });

  // init the zoom button that shows on the modal details for an individual coal plant
  $('#btn-zoom').click(function(){
    const zoomtarget = this.dataset.zoom.split(',');
    const latlng = L.latLng([zoomtarget[0], zoomtarget[1]]);
    const zoom = 16;

    // switch to satellite view
    CONFIG.basemap_control.selectLayer('photo');

    // get the target tracker that opened this info panel
    CONFIG.backbutton.setTargetTracker($(this).data().tracker);

    // set the previous bounds that we should go to when we click the back button
    CONFIG.backbutton.setPreviousBounds(CONFIG.map.getBounds());

    // add the back button, which takes the user back to previous view (see function goBack()
    // but only if there is not already a back button on the map
    if ($('.btn-back').length == 0) CONFIG.backbutton.addTo(CONFIG.map);

    // move and zoom the map to the selected unit, and hide the modal
    CONFIG.map.setView(latlng, zoom);
    $('div#tracker-modal').modal('hide');
  });
}

// initialize the nav tabs: what gets shown, what gets hidden, what needs resizing, when these are displayed
// important: to add a functional tab, you must also include markup for it in css, see e.g. input#help-tab:checked ~ div#help-content {}
function initTabs() {
  $('input.tab').on('click', function(e) {
    // get the type from the id
    let type = e.currentTarget.dataset.tab;
    CONFIG.visible_tab = type;
    switch (type) {
      case 'map':
        // resize the map, show the search form in case it was hidden
        CONFIG.map.invalidateSize(false);
        $('input#search').show();
        break;
      case 'table':
        // draw the table, using any search terms as the title
        let searchterm = $('input#search').val();
        drawTable(DATA.filtered, searchterm);
        resize();
        $('input#search').show();
        break;
      default:
        // hide search forms
        $('input#search').hide();
        break;
    }
  });
}

// Search here uses JSsearch https://github.com/bvaughn/js-search as the search "engine"
function initSearch() {
  // instantiate the search on a "universal id" (or uid in the docs)
  CONFIG.searchengine = new JsSearch.Search('id');
  // add fields to be indexed
  Object.keys(CONFIG.attributes).forEach(function(key) {
    // limit to properties we want specifically want to search, e.g. name, owner, country, etc.
    if (! CONFIG.attributes[key].search ) return;
    CONFIG.searchengine.addIndex(['properties', key]);
  });
  // add data documents to be searched
  let documents = [];
  DATA.rawdata.features.forEach(function(feature) {
    documents.push(feature);
  });
  CONFIG.searchengine.addDocuments(documents);

  // define a search submit function, debounced for performance
  var submitSearch = debounce(function(event) {
    // prevent default browser behaviour, especially on 'enter' which would refresh the page
    event.preventDefault();
    if (event.key === 'Enter' || event.keyCode === 13) return;

    // if the input is cleared, redo the 'everything' search (e.g. show all results)
    // this is distinct from the case of "No results", in searchMapForText
    if (! this.value) {
      clearSearch();
    } else {
      // kick off the search
      searchMapForText();
    }
  }, 250);

  // Init form inputs to submit a search on keyup
  $('input#search').on('keyup', submitSearch);
}

// initialize the map in the main navigation map tab
function initMap() {
  // basic leaflet map setup
  CONFIG.map = L.map('map', {
    attributionControl: false,
    zoomControl: false,
    minZoom: CONFIG.minzoom, maxZoom: CONFIG.maxzoom,
  }).setView([CONFIG.defaultLat, CONFIG.defaultLng], CONFIG.defaultZoom);

  // map panes
  // - create a pane for the carto streets basemap
  CONFIG.map.createPane('basemap-map');
  CONFIG.map.getPane('basemap-map').style.zIndex = 200;

  // - create a pane for the esri satellite tiles
  CONFIG.map.createPane('basemap-photo');
  CONFIG.map.getPane('basemap-photo').style.zIndex = 225;

  // - create map panes for county interactions, which will sit between the basemap and labels
  CONFIG.map.createPane('country-hover');
  CONFIG.map.getPane('country-hover').style.zIndex = 350;
  CONFIG.map.createPane('country-select');
  CONFIG.map.getPane('country-select').style.zIndex = 450;

  // - create a feature highlight pane for pipelines, that sits under the pipelines
  CONFIG.map.createPane('feature-highlight');
  CONFIG.map.getPane('feature-highlight').style.zIndex = 400;

  // - create a feature pane for pipelines
  // the default marker-pane z-index, which PruneCluster writes to, is 600
  // so this puts pipelines below markers
  CONFIG.map.createPane('feature-pipelines');
  CONFIG.map.getPane('feature-pipelines').style.zIndex = 500;

  // - create a pane for basemap tile labels
  CONFIG.map.createPane('basemap-labels');
  CONFIG.map.getPane('basemap-labels').style.zIndex = 575;
  CONFIG.map.getPane('basemap-labels').style.pointerEvents = 'none';

  // define the basemaps
  const basemaps = [
    {
      type: 'google-mutant',
      label: 'photo',
      pane: 'basemap-photo',
      url: 'satellite',
      tooltip: 'Google Satellite'
    },
    {
      type:'xyz',
      label: 'map',
      pane: 'basemap-map',
      maxZoom: CONFIG.maxzoom,
      minZoom: CONFIG.minzoom,
      url: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}' + (L.Browser.retina ? '@2x.png' : '.png'),
      attribution: 'Map tiles by <a target="_blank" href="http://www.mapbox.com">MapBox</a>. Tile data &copy; <a target="_blank" href="http://openstreetmap.org/copyright" target="_blank">OpenStreetMap contributers</a>',
      tooltip: 'Plain grey map with Open Street Map data'
    },
  ];

  // add attribution
  const credits = L.control.attribution({
    prefix: 'Interactive mapping by <a href="https://greeninfo.org" target="_blank">GreenInfo Network</a>. Data: <a href="https://globalenergymonitor.org/" target="_blank">Global Energy Monitor</a>',
    position: 'bottomleft'
  }).addTo(CONFIG.map);

  // construct the basemapbar, it will be added later
  CONFIG.basemap_control = new LeafletBasemapBar({
    layers: basemaps,
    position: 'topright',
    credits: credits,
  });

  // construct the custom zoom home control, it will be added later
  CONFIG.zoombar = new LeafletZoomBar({
    position: 'topright',
    homeLatLng: [CONFIG.defaultLat, CONFIG.defaultLng],
    homeZoom: CONFIG.defaultZoom,
  });

  // on mobile, hide the legend
  const layercontrol = $('.layer-control');
  if (isMobile()) layercontrol.hide();

  // create an instance of L.backButton()
  CONFIG.backbutton = new LeafletBackButton({
    basemapControl: CONFIG.basemap_control,
    defaultBasemap: CONFIG.default_basemap,
    filteredData: DATA.filtered,
    drawMapFn: drawMap,
    updateResultsPanelFn: updateResultsPanel,
    statusSelector: 'div#status-types input',
    typeSelector: 'div#fossil-types input',
  }) // not added now, see initButtons()

  // listen for changes to the map, and update state params
  CONFIG.map.on('move zoom', function() {
    updateStateParams();
  });

  // country hover is annoying at high zoom
  CONFIG.map.on('zoomend', function() {
    if (CONFIG.map.getZoom() > 10) {
      CONFIG.countries.removeFrom(CONFIG.map);
    } else {
      CONFIG.countries.addTo(CONFIG.map);
    }
  });

  // double click zoom is confusing if it selects a country; try and track and prevent that
  // see also massageCountryFeaturesAsTheyLoad()
  // we don't bother with this on other features: it seems unlikely a doubleClick to zoom will be right on top of a marker
  CONFIG._dblClickTimer = null;
  CONFIG.map.on("dblclick", function() {
    clearTimeout(CONFIG._dblClickTimer);
    CONFIG._dblClickTimer = null;
  });
}

function initMapLayers() {
  // Add a layer to hold countries, for click and hover (not mobile) events on country features
  CONFIG.countries = L.featureGroup([], { pane: 'country-hover' }).addTo(CONFIG.map);
  const countries = L.geoJSON(DATA.country_data,{ style: CONFIG.country_no_style, onEachFeature: massageCountryFeaturesAsTheyLoad }).addTo(CONFIG.countries);

  // add a layer to hold any selected country
  CONFIG.selected_country = {};
  CONFIG.selected_country.layer = L.geoJson([], {
    style: CONFIG.country_selected_style, pane: 'country-select'
  }).addTo(CONFIG.map);

  // add a layer to hold features for pipelines
  CONFIG.pipelines_layer = L.featureGroup([], { pane: 'feature-pipelines' }).addTo(CONFIG.map); // on by default

  // Add a layer to hold line feature highlights, for click and hover (not mobile) events on fossil features
  CONFIG.feature_hover = L.featureGroup([], { pane: 'feature-highlight' }).addTo(CONFIG.map);
  CONFIG.feature_select = L.featureGroup([], { pane: 'feature-highlight' }).addTo(CONFIG.map);

  // add the labels to the top of the stack
  let labels = L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_only_labels/{z}/{x}/{y}@2x.png', { pane: 'basemap-labels' });
  CONFIG.map.addLayer(labels);

  // Add a layer to hold features for clusters 
  CONFIG.cluster_layer = L.featureGroup([], {}).addTo(CONFIG.map);

  // add the basemap control with default basemap, and the zoom control
  CONFIG.basemap_control.addTo(CONFIG.map).selectLayer(CONFIG.default_basemap);
  CONFIG.zoombar.addTo(CONFIG.map);

  // create a mutation observer, so we can respond to changes to the map and basemap buttons
  const attrObserver = new MutationObserver((mutations) => {
    mutations.forEach(mu => {
      if (mu.type !== "attributes" && mu.attributeName !== "class") return;
      let layer = mu.target.dataset.layer;
      switch (layer) {
        case 'map':
        case 'photo':
          updateStateParams();
          break;
      }
    });
  });

  // register the observers on the specified elements
  const basemap_observers = document.querySelectorAll(".leaflet-control-basemapbar-option");
  basemap_observers.forEach(el => attrObserver.observe(el, {attributes: true}));

  // mobile feature styles: larger lines, bigger circles, for easier clicks
  if ( isMobile() ) {
    styles.circlesize = styles.circlesize_mobile;
  }
}

// Create and init the legend and layer control
// there are several classes of controls, that work independently,
// you can toggle features on the map by type OR by status OR ...
function initMapControls() {
  // grab keys for fossil and status types. Each of these will be one legend 'section', and the keys within will form one entry per type
  let statuses = Object.keys(CONFIG.status_types);
  let types = Object.keys(CONFIG.fossil_types);

  // iterate STATUS TYPES, and create the legend entries for each
  statuses.sort(function(a,b) {return CONFIG.status_types[a]["order"] - CONFIG.status_types[b]["order"]});
  let target = $('div.layer-control div#status-types div.leaflet-control-layers-overlays');
  statuses.forEach(function(status) {
    // add a wrapper for the legend items
    let inner = $('<div>', {'class': 'legend-labels'}).appendTo(target);
    // then add a label and checkbox
    let label = $('<label>').appendTo(inner);
    let input = $('<input>', {
      type: 'checkbox',
      value: status,
      'data-val': status,
      checked: true,
    }).appendTo(label);
    // now add colored circle to legend
    let outerSpan = $('<span>').appendTo(label);
    let div = $('<div>', {
      'class': `circle ${CONFIG.status_types[status].cssclass}`,
    }).appendTo(outerSpan);
    let innerSpan = $('<span>', {
      text: ' ' + CONFIG.status_types[status].text
    }).appendTo(outerSpan);
  });

  // iterate FOSSIL TYPES, and create the legend entries for each
  types.sort(function(a,b) {return CONFIG.fossil_types[a]["order"] - CONFIG.fossil_types[b]["order"]});
  types.forEach(function(type) {
    let target = $('div.layer-control div#fossil-types div.leaflet-control-layers-overlays');
    // add a wrapper for the legend items
    let inner = $('<div>', {'class': 'legend-labels'}).appendTo(target);
    // then add a label and checkbox
    let label = $('<label>').appendTo(inner);
    let input = $('<input>', {
      type: 'checkbox',
      value: type,
      'data-val': type,
      checked: true,
    }).appendTo(label);
    // now add shape to legend
    let outerSpan = $('<span>').appendTo(label);
    let div = $('<div>', {
      'class': `empty ${CONFIG.fossil_types[type].shape}`,
    }).appendTo(outerSpan);
    let innerSpan = $('<span>', {
      text: CONFIG.fossil_types[type].text,
      'class': 'legend-label',
      'data-lang': type,
    }).appendTo(outerSpan);
  });

  // Set up change triggers on the inputs.
  // In short, draw the map. Note: data filtering happens in drawMap, not here
  $('div.layer-control div.leaflet-control-layers-overlays').on('change', 'input', function(e) {
    // draw the map and results panel
    drawMap();
    let message = getResultsMessage();
    updateResultsPanel(message);

    // clear out any text search
    $('a.clear-search').hide();
    $('input#search').val('');

    // clear out any country search
    CONFIG.selected_country.name = '';
    CONFIG.selected_country.layer.clearLayers();

    // finally, update URL params
    updateStateParams();
  });
}

// initialize the PruneClusters, and override some factory methods
function initPruneCluster() {
  // create a new PruceCluster object, with a minimal cluster size of (X)
  // updated arg to 30; seems to really help countries like China/India
  CONFIG.clusters = new PruneClusterForLeaflet(30);
  CONFIG.cluster_layer.addLayer(CONFIG.clusters);

  // this is from the categories example; sets ups cluster stats used to derive category colors in the clusters
  CONFIG.clusters.BuildLeafletClusterIcon = function(cluster) {
    let e = new L.Icon.MarkerCluster();
    e.stats = cluster.stats;
    e.population = cluster.population;
    return e;
  };

  const pi2 = Math.PI * 2;

  L.Icon.MarkerCluster = L.Icon.extend({
    options: {
      iconSize: new L.Point(22, 22),
      className: 'prunecluster leaflet-markercluster-icon'
    },

    createIcon: function () {
      // based on L.Icon.Canvas from shramov/leaflet-plugins (BSD licence)
      let e = document.createElement('canvas');
      this._setIconStyles(e, 'icon');
      let s = this.options.iconSize;
      e.width = s.x;
      e.height = s.y;
      this.draw(e.getContext('2d'), s.x, s.y);
      return e;
    },

    createShadow: function () {
      return null;
    },

    draw: function(canvas, width, height) {
      // the pie chart itself
      let start = 0;
      for (let i = 0, l = CONFIG.markercluster_colors.length; i < l; ++i) {
        // the size of this slice of the pie
        let size = this.stats[i] / this.population;
        if (size > 0) {
          canvas.beginPath();
          canvas.moveTo(11, 11);
          canvas.fillStyle = CONFIG.markercluster_colors[i];
          // start from a smidgen away, to create a tiny gap, unless this is a single slice pie
          // in which case we don't want a gap
          let gap = size == 1 ? 0 : 0.15
          let from = start + gap;
          let to = start + size * pi2;

          if (to < from) {
            from = start;
          }
          canvas.arc(11,11,11, from, to);
          start = start + size*pi2;
          canvas.lineTo(11,11);
          canvas.fill();
          canvas.closePath();
        }
      }

      // the white circle on top of the pie chart, to make the middle of the "donut"
      canvas.beginPath();
      canvas.fillStyle = 'white';
      canvas.arc(11, 11, 7, 0, Math.PI*2);
      canvas.fill();
      canvas.closePath();

      // the text label count
      canvas.fillStyle = '#555';
      canvas.textAlign = 'center';
      canvas.textBaseline = 'middle';
      canvas.font = 'bold 9px sans-serif';

      canvas.fillText(this.population, 11, 11, 15);
    }
  });

  // we override this method: don't force zoom to a cluster on click (the default)
  CONFIG.clusters.BuildLeafletCluster = function (cluster, position) {
    let _this = this;
    let m = new L.Marker(position, {
      icon: this.BuildLeafletClusterIcon(cluster)
    });
    // this defines what happen when you click a cluster, not the underlying icons
    m.on('click', function () {
      let markersArea = _this.Cluster.FindMarkersInArea(cluster.bounds);
      let b = _this.Cluster.ComputeBounds(markersArea);
      if (b) {
        // skip the force zoom that is here by default, instead, spiderfy the overlapping icons
        _this._map.fire('overlappingmarkers', { cluster: _this, markers: markersArea, center: m.getLatLng(), marker: m });
      }
    });
    return m;
  }

  // we override this method to handle clicks on individual plant markers (not the clusters)
  CONFIG.clusters.PrepareLeafletMarker = function(leafletMarker, data) {
    let html = `<div style='text-align:center;'><strong>${data.title}</strong><br><div class='popup-click-msg'>Click the ${data.icon.options.shape} for details</div></div>`;
    leafletMarker.bindPopup(html);
    leafletMarker.setIcon(data.icon);
    leafletMarker.attributes = data.attributes;
    leafletMarker.coordinates = data.coordinates;
    leafletMarker.on('click',function () {
      openTrackerInfoPanel(this);
    });
    leafletMarker.on('mouseover', function() {
      this.openPopup();
    });
    leafletMarker.on('mouseout', function() { CONFIG.map.closePopup(); });
  }
}

// itialization functions for the table. Table data is populated only after a search is performed
function initTable() {
  // put table column names into format we need for DataTables
  const colnames = [];
  Object.keys(CONFIG.attributes).forEach(function(d) {
    if (CONFIG.attributes[d].table) {
      colnames.push({
        'title': CONFIG.attributes[d].name,
        'className': CONFIG.attributes[d].classname, 
      });
    }
  });

  // set up table attribute names, used in getTableData
  DATA.table_attributes = Object.keys(CONFIG.attributes).filter(function(m) { return CONFIG.attributes[m].table == true })

  // pass a single row of synthetic data to the table for now
  // we'll swap in the real data in drawTable()
  let tabledata = [new Array(colnames.length).fill('blank')];

  // initialize the DataTable instance
  CONFIG.table = $('#table-content table').DataTable({
    data           : tabledata,
    columns        : colnames,
    autoWidth      : false,
    lengthMenu     : [50, 100, 500],
    iDisplayLength : 100, // 100 has a noticable lag to it when displaying and filtering; 10 is fastest
    dom            : 'litp',
    deferRender    : true,
  });

  // OPTIONAL add tippy content to col names where indicated in CONFIG.attributes
  Object.keys(CONFIG.attributes).forEach(function(d) {
    if (! CONFIG.attributes[d].hasOwnProperty('classname') || ! CONFIG.attributes[d].hasOwnProperty('tooltip')) return;
    let classname = CONFIG.attributes[d].classname;
    let tooltip = CONFIG.attributes[d].tooltip;
    let header = $(`.dataTables_wrapper th.${classname}`);
    let html = header.html();
    let tiphtml = html += `<span class="info" data-tippy-content="${tooltip}"></span>`;
    header.html(tiphtml);
  });

  // Init the tooltips. Not much to it...
  // Note: this will only init the tooltips on the table, if there are others, then you'll need a more generic method to initialize them
  tippy('[data-tippy-content]', {});
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////
///// NAMED FUNCTIONS 
///////////////////////////////////////////////////////////////////////////////////////////////////////////

function resetTheMap() {
  // clear anything in the search inputs
  $('input#search').val('');
  $('a.clear-search').hide();

  // clear any existing country and feature selection on the map
  CONFIG.selected_country.layer.clearLayers();
  CONFIG.selected_country.name = '';
  DATA.filtered = DATA.rawdata.features; // reset filtered data equal to all data
  $('div#zoom-filtered').remove();

  // check all checkboxes
  $('div.leaflet-control-layers-overlays input').prop('checked','checked');

  // switch back to the map tab
  $('input#map-tab').click();

  // reset the data, and draw the map and results
  drawMap();
  updateResultsPanel();

  // resize everything
  resize();

  // reset the default map view extent, map and basemap
  $('div.leaflet-control-mapswitcher-option[data-layer="plantview"]').click();
  CONFIG.map.setView([CONFIG.defaultLat, CONFIG.defaultLng], CONFIG.defaultZoom);
  CONFIG.basemap_control.selectLayer(CONFIG.default_basemap);
}

// the main map update rendering function that filters the data based on selected map controls
// and then updates the lines and clusters on the map
function drawMap(filter=true) {
  // filter the data based on the current set of checkboxes, etc.
  if (filter) filterData();

  // assume the data has changed: TODO - could lead to false triggers here?
  CONFIG.refresh_table = true;

  // clear the map (points will get cleared in updateClusters)
  CONFIG.pipelines_layer.clearLayers();

  // create a container for the points to pass to updateClusters()
  let points_to_cluster = [];
  let layers = L.geoJSON(DATA.filtered, {
    pane: 'feature-pipelines',
    onEachFeature: function (feature, layer) {
      // Bind tooltips and popups, and set the color for this status
      // but only for pipelines - PruneCluster handles points
      if (layer.feature.geometry.type == "Point") return;

      // bind a popup that matches the point popups
      var html = `<div style='text-align:center;'><strong>${feature.properties.project}</strong><br><div class='popup-click-msg2'>Click the line for details</div></div>`;
      layer.bindPopup(html, {autoPan: false});

      // clear click highlights on popup close
      layer.on('popupclose', function() {
        CONFIG.feature_select.clearLayers();
      });

      // define click functionality
      layer.on('click',function (e) {
        // clear any existing feature highlights
        CONFIG.feature_select.clearLayers();
        // bypass point features, and only highlight lines
        if ( e.target.feature.geometry.type == 'LineString' || e.target.feature.geometry.type == 'MultiLineString' ) {
          var highlight = L.polyline(e.target.getLatLngs(), { pane: 'feature-highlight' });
          highlight.setStyle(CONFIG.feature_select_style);
          highlight.addTo(CONFIG.feature_select);
        } 
        // finally, open the info panel
        openTrackerInfoPanel(this.feature);
      });

      layer.on('mouseover', function(e) {
        this.openPopup();
        // show hovered line features with a hover style
        // but only on Desktop
        if (! (isTouch() && ( isMobile() || isIpad() ))) {
          // for now bypass point features, and only highlight lines
          if ( e.target.feature.geometry.type == 'LineString' || e.target.feature.geometry.type == 'MultiLineString' ) {
            var hover = L.polyline(e.target.getLatLngs(), { pane: 'feature-highlight' });
            hover.setStyle(CONFIG.feature_hover_style);
            hover.addTo(CONFIG.feature_hover);
          }
        }
      });
      layer.on('mouseout', function() { 
        CONFIG.feature_hover.clearLayers();
      });

      let status = feature.properties.status;
      let cssclass = `status${CONFIG.status_types[status]['order']}`;
      // fossil-feature class allows us to distinguish between fossil features and countries on hover
      layer.setStyle({ 
        color: styles[cssclass], 
        weight: styles.linewidth, 
        opacity: styles.lineopacity, 
        'className': 'fossil-feature',
      });

    },
    filter: function(feature) {        
      // tricky part: return true for Lines, false for Points
      // also grab a copy of points to send to PruneCluster
      if (feature.geometry.type == "Point") {
        points_to_cluster.push(feature);
        return false;
      } else {
        return true;
      }
    }
  })

  layers.addTo(CONFIG.pipelines_layer);

  // final step: update the clusters with the points we just collected
  updateClusters(points_to_cluster);
}

// main data filtering function
function filterData() {
  // get selected statuses
  let statuses = $('div#status-types input:checkbox:checked').map(function() {
    return this.dataset.val;
  }).get();

  // get selected types
  let types = $('div#fossil-types input:checkbox:checked').map(function() {
    return this.value;
  }).get();

  // filter raw data for the current set of checkboxes.
  DATA.filtered = DATA.rawdata.features.filter(function(d) {
    return statuses.indexOf(d.properties.status) > -1 && types.indexOf(d.properties.type) > -1;
  });
}


// given filtered point data, update and render the clusters
function updateClusters(data) {
  // start by clearing out existing clusters 
  CONFIG.clusters.RemoveMarkers();
  CONFIG.clusters.ProcessView();

  // iterate over the current set of filtered data and set up the clusters
  data.forEach(function(feature) {
    // the "status" of the tracker point affects its icon color
    let status = feature.properties.status;
    let type = feature.properties.type;

    // the following are used to symbolize "spidered" (unclustered) markers
    let shape = CONFIG.fossil_types[type]['shape'];
    let symbolClass = `${shape}-div`;
    let statusId = CONFIG.status_types[status]['order'];
    let statusClass = `status${statusId}`;

    let lng = feature.geometry.coordinates[0];
    let lat = feature.geometry.coordinates[1];

    let icon = L.divIcon({
      className: `${symbolClass} ${statusClass}`, // Specify a class name we can refer to in CSS.
      iconSize: [15, 15], // Set the marker width and height
      shape: shape,
    });

    if (shape == 'diamond') {
      icon.options.iconSize = [30, 30];
      // note: fill set with CSS classes
      icon.options.html = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" version="1.1" preserveAspectRatio="none" viewBox="0 0 100 100">
        <path d="m50 14.5-35.5 35.5 35.5 35.5 35.5-35.5z"/>
      </svg>`
    }

    // register the marker for PruneCluster clustering
    // or, if it's a coal_terminal, add it to the terminals layer
    let marker;
    
    marker = new PruneCluster.Marker(parseFloat(lat), parseFloat(lng), {
      title: feature.properties.project,
      icon: icon,
    });

    // get the attributes for use in the custom popup dialog (see openTrackerInfoPanel())
    marker.data.attributes = feature.properties;

    // get the lat-lng now so we can zoom to the plant's location later
    // getting the lat-lng of the spider won't work, since it gets spidered out to some other place
    // tip: the raw dataset is lng,lat and Leaflet is lat,lng
    marker.data.coordinates = [ lat, lng ];

    // set the category for PruneCluster-ing. Note this is 0 indexed
    let order = CONFIG.status_types[status]['order'];
    marker.category = parseInt(order - 1);

    // all set with this marker, register it
    CONFIG.clusters.RegisterMarker(marker);
  });

  // all set with all markers! process the view, and fit the map to the new bounds
  CONFIG.clusters.ProcessView();
}

// update the "results" panel that sits above the map, top left
// this always shows either the Global tally of things, or a country-specific count, or a count from a search term enterd in the "Free Search" input
function updateResultsPanel(title=CONFIG.default_title, countrysearch=false) {
  // if we got here after a country search, then we display data only for that single country
  // otherwise, we use DATA.filtered
  let data;
  if (countrysearch) {
    data = [];
    DATA.rawdata.features.forEach(function(feature) {
      // look for matching names in feature.properties.country
      let countries = feature.properties['countries'].split(',').map(item => item.trim());
      if (countries.indexOf(title) > -1) data.push(feature);
    });
  } else {
    data = DATA.filtered;
  }

  // update primary content
  $('div#country-results div#results-title h3').text(title);
  // update the total count
  let totalrow = $('div#country-results div#total-count').empty();
  let numtext = CONFIG.format.number(data.length);
  let totaltext = data.length > 0 ? (data.length > 1 ? `${numtext} ${CONFIG.fossil_name}s` : `${numtext} ${CONFIG.fossil_name}`) : `Nothing found`;
  let total = $('<div>',{text: totaltext}).appendTo(totalrow);
  // add the "zoom to" button, but not if we're showing everything
  // and not if countrysearch
  if (! countrysearch) {
    if (data.length && data.length != DATA.rawdata.features.length) {
      $('<div id="zoom-filtered"><a class="zoomto">zoom to results</a></div>').appendTo(totalrow);
    }
  }

  // tally results per status, and add a row for each if there is more than one
  let results = $('div#type-count').empty();

  // for each fossil type, get the count of that type from the data
  Object.keys(CONFIG.fossil_types).forEach(function(type) {
    var count = 0;
    data.forEach(function(d) {
      // count matching processes, but only if the accompanying checkbox is checked
      // and its process is selected
      // AND it's ID does not include a "-", as these are expansions and shouldn't be counted
      if ( d.properties.type == type ) count += 1;
    });
    // format label for type(s) and add to results
    // show a count for all types, whether 0 or >0
    var label = CONFIG.fossil_types[type].text;
    var html = `${label}<span>${count}</span>`;
    let div = $('<div>', {html: html}).appendTo(results);
    if (count == 0) div.addClass('zerocount');
  });
}

// invoked by clicking "zoom to results" on zoom panel
function zoomToResults() {
  // not much to it:
  if (DATA.filtered.length) {
    let bounds = L.geoJSON(DATA.filtered).getBounds();
    CONFIG.map.fitBounds(bounds);
  }
}

// draw or update the table on the "Table" tab
function drawTable(data=DATA.rawdata.features, title) {
  // short circuit: if nothing has changed, then quit early
  if (! CONFIG.refresh_table) return;
  CONFIG.refresh_table = false;

  // update the table name, if provided
  const text = title ? title : getResultsMessage();
  $('div#table h3 span').text(text);

  // get the data in the format that DT wants
  const tabledata = getTableData(data);

  // Redraw the table, just clear and update rows  
  CONFIG.table.clear();
  CONFIG.table.rows.add(tabledata);
  CONFIG.table.columns.adjust().draw();
}

function getTableData(incoming_data) {
  // set up the table data
  const data = [];

  incoming_data.forEach(function(tracker) {
    // get the properties for each feature
    const properties = tracker.properties;
    // make up a row entry for the table: a list of column values.
    // and copy over all columns from [names] as is to this row
    const row = [];
    DATA.table_attributes.forEach(function(name) {
      // if it has a value, lookup the value on properties, and format it
      let value = properties[name];
      if (value === undefined || value == '' ) {
        value = 'n/a';
      } else if (name == 'project') {
        value = '<a href="' + tracker.properties['url'] + '" target="_blank" title="click to open the Wiki page for this project">' + tracker.properties.project + '</a>';
      } else if (name == 'status_tabular') {
        value = CONFIG.status_types_tabular[value].text;
      } else if (name == 'type') {
        value = CONFIG.fossil_types[value].text;
      } else {
        // regular case
        value = CONFIG.format[CONFIG.attributes[name].format](value);
      }

      // all set, push this to the row
      row.push(value);
    });

    // and all set with the row, push the row to the data array
    data.push(row);
  });

  return data;
}

// generic function to search for text. 
function searchMapForText() {
  // get the keywords to search
  const keywords = $('input#search').val();
  
  // find data matching the keyword
  DATA.filtered = CONFIG.searchengine.search(keywords);
  
  // always update the map, but don't filter based on checkbox state
  drawMap(false);                                        
  
  // update the table, but only if visible
  if (CONFIG.visible_tab == 'table') drawTable(DATA.filtered, keywords); 
  
  updateResultsPanel(keywords);                          // update the results-panel
  CONFIG.selected_country.layer.clearLayers();           // clear any selected country
  CONFIG.selected_country.name = '';                     // ... and reset the name
  $('div#country-results').show();                       // show the results panel, in case hidden
  $('a.clear-search').show();                            // show the clear search links
  $('div.leaflet-control-layers-overlays input').prop('checked','checked'); // select everything in the legend
  updateStateParams();                                   // update state params
}

// generic function to clear search results
function clearSearch() {
  $('input#search').val('');
  $('.clear-search').hide();
  DATA.filtered = DATA.rawdata.features;
  $('div#zoom-filtered').remove();

  // map
  drawMap();
  updateResultsPanel();
  // table
  CONFIG.refresh_table = true;
  drawTable();
  // update params
  updateStateParams();
}

// this callback is used when CONFIG.countries is loaded via GeoJSON; see initMap() for details
function massageCountryFeaturesAsTheyLoad(rawdata,feature) {
  // only register hover events for non-touch, non-mobile devices
  // including isMobile() || isIpad() here to include iPad and exclude "other" touch devices here, e.g. my laptop, which is touch, but not mobile
  if (! (isTouch() && ( isMobile() || isIpad() ))) {

    // on mouseover, highlight me; on mouseout quit highlighting
    feature.on('mouseover', function (e) {
      // keep a reference to the hovered featured feature
      // and unhighlight other countries that may already be highlighted
      const name = this.feature.properties['NAME'];
      if (name != CONFIG.hovered) CONFIG.countries.setStyle(CONFIG.country_no_style);
      CONFIG.hovered = name;
      // then highlight this country
      this.setStyle(CONFIG.country_hover_style);
    }).on('mouseout', function (e) {
      // on mouseout, remove the highlight, unless
      // we are entering one of our map features, i.e. a pipeline, or terminal
      // note: this isn't enough to trap everything, see mouseover() above
      if ( e.originalEvent.toElement && e.originalEvent.toElement.classList.contains('fossil-feature') ) return;
      CONFIG.hovered = '';
      this.setStyle(CONFIG.country_no_style);
    });
  }
  // always register a click event: on click, search and zoom to the selected country
  feature.on('click', function() { selectCountry(this.feature) });
}

// define what happens when we click a country
function selectCountry(feature) {
  // clear the search input
  $('input#search').val('');
  // get the name of the clicked country, and keep a reference to it
  const name = feature.properties['NAME'];
  // if we've clicked an alredy-selected country again, clear the selection, reset the search
  if (CONFIG.selected_country.name == name) {
    CONFIG.selected_country.name = '';
    CONFIG.selected_country.layer.clearLayers();
    drawMap();
    updateResultsPanel();
  } else {
    CONFIG.selected_country.name = name;
    // highlight it on the map, first clearning any existing selection
    CONFIG.selected_country.layer.clearLayers();
    CONFIG.selected_country.layer.addData(feature);
    // call the search function
    let bounds = L.geoJSON(feature).getBounds();
    searchCountryByName(name, bounds);
    // clear out any text search
    $('a.clear-search').hide();
    $('input#search').val('');
  }

  // update state params
  updateStateParams();
}

// on other applications, this has filtered the data to this country;
// here, we only zoom to the bounds of the country, and continue to show items outside of its boundaries
function searchCountryByName(countryname, bounds) {
  // if bounds were provided, zoom the map to the selected country
  // some countries require special/custom bounds calcs, because they straddle the dateline or are otherwise non-standard
  if (bounds) {
    switch (countryname) {
      case 'Russia':
        bounds = L.latLngBounds([38.35400, 24], [78.11962,178]);
        break;
      case 'United States':
        bounds = L.latLngBounds([18.3, -172.6], [71.7,-67.4]);
        break;
      case 'Canada':
        bounds = L.latLngBounds([41.6, -141.0], [81.7,-52.6]);
        break;
      default: break;
    }
    // got bounds, fit the map to it
    setTimeout(function() {
      CONFIG.map.fitBounds(bounds);
    }, 0);

  } // has bounds

  // Note: we are not filtering the data by this country, but only zooming to it
  // instead, it shows everything in the legend (since everything IS on the map, but not in the results panel)
  $('div.leaflet-control-layers-overlays input').prop('checked','checked'); // select everything in the legend
  drawMap();
  updateResultsPanel(countryname, true);
}

// craft a message for the results panel, depending on what's checked and what's not
function getResultsMessage() {
  let statuscount = $('div#status-types input').length;
  let statuschecked = $('div#status-types input:checked').length;

  let typecount = $('div#fossil-types input').length;
  let typechecked = $('div#fossil-types input:checked').length;

  let message = '';
  if (statuscount == statuschecked && typecount == typechecked) {
    message = CONFIG.default_title;
  } else if (statuscount != statuschecked && typecount != typechecked) {
    message = 'Filtered by type and status';
  } else if (statuscount == statuschecked && typecount != typechecked) {
    message = 'Filtered by type';
  } else if (statuscount != statuschecked && typecount == typechecked) {
    message = 'Filtered by status';
  }
  return message;
}

// when user clicks on a coal plant point, customize a popup dialog and open it
function openTrackerInfoPanel(feature) {
  // get the features properties, i.e. the data to show on the modal
  // pipelines and points have these stored in a diffferent location
  let properties = feature.attributes || feature.properties;

  // Grab a reference to the popup and clear existing markup
  const popup = $('#tracker-modal');
  popup.find('.modal-cols').empty();

  // go through each property for this one feature, and write out the value to the correct span, according to data-name property
  let cnt = 1;
  Object.keys(CONFIG.attributes).forEach(function(attr, i) {
    // if this is not flagged for the popup, return
    if (! CONFIG.attributes[attr].popup) return;

    // get the target location for this row
    const index = cnt <= CONFIG.number_of_rows_per_popup_column ? 1 : 2;
    const target = $(`#tracker-modal .modal-content .modal-body #modal-col-${index}`);
    cnt += 1;

    // set the key
    const key = CONFIG.attributes[attr].name;

    // if it has a value, lookup the value on properties, and format it
    let value = properties[attr];
    if (value === undefined || value == '' ) {
      value = 'n/a';
    } else {
      value = CONFIG.format[CONFIG.attributes[attr].format](value);
      // custom handler for status_tabular: get the formatted string
      if (attr == 'status_tabular') value = CONFIG.status_types_tabular[value].text;
      // custom handler for type: get the formatted string
      if (attr == 'type') value = CONFIG.fossil_types[value].text;
      // custom handler for capacity: add the units to the value
      if (attr == 'capacity' || attr == 'production') {
        let format = CONFIG.attributes[attr].format;
        value = `${CONFIG.format[format](properties[attr])} ${properties['units']}`;
      } 
    }
    // construct and add the row
    const outer = $('<p>', {class: 'modal-row-outer'}).appendTo(target);
    $('<span>', {class: 'key fw-bold', text: `${key}: `} ).appendTo(outer);
    $('<span>', {class: 'value', text: value} ).appendTo(outer);
  });

  // wiki page needs special handling to format as <a> link
  let wikilink = popup.find('a#wiki-link');
  if (properties['url']) {
    wikilink.attr('href', properties['url']);
    wikilink.show();
  } else {
    wikilink.hide();
  }

  // format the zoom-to button data.zoom attribute. See $('#btn-zoom').click();
  // this lets one zoom to the location of the clicked plant
  // note: We aren't doing this for pipelines, which conveniently don't have feature.coordinates
  var zoomButton = $('#btn-zoom').hide();
  if (feature.coordinates) {
    zoomButton.show();
    zoomButton.attr('data-zoom', feature.coordinates[0] + "," + feature.coordinates[1]);

    // add the feature to the zoom button as well, for access by the back button
    // the desire is for the back button to open this same info-panel
    // because this is a full-blown Leaflet object with functions and such, use jQuery data() not the low-level HTML data attribute
    zoomButton.data().tracker = feature;
  }

  // all set: open the dialog
  popup.modal('show');
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////
///// SHIMS AND UTILITIES: Various polyfills to add functionality
///////////////////////////////////////////////////////////////////////////////////////////////////////////
// trim() function
if(!String.prototype.trim) { String.prototype.trim = function () {return this.replace(/^\s+|\s+$/g,'');};}

// string Capitalize
String.prototype.capitalize = function() { return this.charAt(0).toUpperCase() + this.slice(1);}

// check if a div has a horizontal scrollbar
$.fn.hasHorizontalScrollBar = function() {return this.get(0).scrollWidth > this.get(0).clientWidth; }

// get an object's keys
Object.keys||(Object.keys=function(){"use strict";let t=Object.prototype.hasOwnProperty,r=!{toString:null}.propertyIsEnumerable("toString"),e=["toString","toLocaleString","valueOf","hasOwnProperty","isPrototypeOf","propertyIsEnumerable","constructor"],o=e.length;return function(n){if("object"!=typeof n&&("function"!=typeof n||null===n))throw new TypeError("Object.keys called on non-object");var c,l,p=[];for(c in n)t.call(n,c)&&p.push(c);if(r)for(l=0;o>l;l++)t.call(n,e[l])&&p.push(e[l]);return p}}());

// get a string's Troper Case
String.prototype.toTitleCase=function(){let e,r,t,o,n;for(t=this.replace(/([^\W_]+[^\s-]*) */g,function(e){return e.charAt(0).toUpperCase()+e.substr(1).toLowerCase()}),o=["A","An","The","And","But","Or","For","Nor","As","At","By","For","From","In","Into","Near","Of","On","Onto","To","With"],e=0,r=o.length;r>e;e++)t=t.replace(new RegExp("\\s"+o[e]+"\\s","g"),function(e){return e.toLowerCase()});for(n=["Id","Tv"],e=0,r=n.length;r>e;e++)t=t.replace(new RegExp("\\b"+n[e]+"\\b","g"),n[e].toUpperCase());return t};

// function to indicate whether we are likely being viewed on a touch device
function isTouch() { return !!("ontouchstart" in window) || window.navigator.msMaxTouchPoints > 0; }

// function to detect if we are likely being view on iPad
function isIpad() { return (navigator.userAgent.match(/iPad/i)) && (navigator.userAgent.match(/iPad/i)!= null); }

// variable to show if we are are on a mobile or iPad client
const mobileDetect = new MobileDetect(window.navigator.userAgent);
function isMobile() { return mobileDetect.mobile(); }

// reduce arrays to unique items
const uniq = (a) => { return Array.from(new Set(a));}

// wait for a variable to exist. When it does, fire the given callback
function waitForIt(key, callback) {
  if (key) {
    callback();
  } else {
    setTimeout(function() {
      waitForIt(key, callback);
    }, 100);
  }
};

// https://davidwalsh.name/javascript-debounce-function
// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
function debounce(func, wait, immediate) {
  var timeout;
  return function() {
    var context = this, args = arguments;
    var later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
};