// leaflet-back-button.js

// a leaflet control to take the user back to where they came
// Only visible when zooming to an individual plant from the dialog popup. See $('#btn-zoom').click()
const LeafletBackButton = L.Control.extend({
	options: {
	  position: 'bottomleft',
	},

    initialize: function(options) {
        L.setOptions(this,options);

        // keep a reference to the basemap control, used below
        this.basemapControl = options.basemapControl;
        this.defaultBasemap = options.defaultBasemap;
        this.filteredData = options.filteredData;
        this.drawMapFn = options.drawMapFn;
        this.updateResultsPanelFn = options.updateResultsPanelFn;
        this.statusSelector = options.statusSelector;
        this.typeSelector = options.typeSelector;
    },

	onAdd: function (map) {
	  var container   = L.DomUtil.create('div', 'btn btn-primary btn-back', container);
	  container.title = 'Click to go back to the previous view';
	  this._map       = map;

	  // generate the button
	  var button = L.DomUtil.create('a', 'active', container);
	  button.control   = this;
	  button.href      = 'javascript:void(0);';
	  button.innerHTML = '<span class="glyphicons glyphicons-chevron-left"></span><span id="go-back-text">Go Back</span>';

	  L.DomEvent
	    .addListener(button, 'click', L.DomEvent.stopPropagation)
	    .addListener(button, 'click', L.DomEvent.preventDefault)
	    .addListener(button, 'click', function () {
	      this.control.goBack();
	    });

	  // all set, L.Control API is to return the container we created
	  return container;
	},

	// the function called by the control
	goBack: function (basemapControl) {
	  // set the map to the previous bounds
	  this._map.fitBounds(this._previousBounds);

	  // optionally reset status checkboxes
	  if (this._statuses) {
	  	// uncheck all
		document.querySelectorAll(this.statusSelector).forEach(function(e) {e.checked = false})
	  	// check only those specified in this._statuses
	  	this._statuses.forEach(function(status) {
	  		document.querySelector(`input[value="${status}"]`).checked = true;
	  	})
	  }

	  // optionally reset type checkboxes
	  if (this._types) {
		document.querySelectorAll(this.typeSelector).forEach(function(e) {e.checked = false})
	  	// check only those specified in this._types
	  	this._types.forEach(function(type) {
	  		document.querySelector(`input[value="${type}"]`).checked = true;
	  	})
	  }

	  // optionally redraw the map with the given data and a draw function
	  if (this._previousData) {
		  this.filteredData = this._previousData;
		  this.drawMapFn();
	  }

	  // optionally refresh the results message
	  if (this._previousResultsMessage) {
	  	this.updateResultsPanelFn(this._previousResultsMessage);
	  }

	  // click the target tracker, so as to open it's info panel
	  this._targetTracker.fire('click');

	  // remove the back button from the map
	  this.remove(this._map);

	  // restore the default view
	  this.basemapControl.selectLayer(this.defaultBasemap);
	},

	// public method to set the previous bounds that clicking the button takes us to
	setPreviousData: function (previousData, fn) {
		this._previousData = previousData;
		this._previousDataFn = fn;
	},

	// public method to set status checkboxes
	setStatusChecks: function(statuses) {
		this._statuses = statuses;
	},

	// public method to set type checkboxes
	setTypeChecks: function(types) {
		this._types = types;
	},

	// public method to set a results panel message
	setPreviousResultsMessage: function(previousMsg) {
		this._previousResultsMessage = previousMsg;
	},

	// public method to set the previous bounds that clicking the button takes us to
	setPreviousBounds: function (bounds) {
		this._previousBounds = bounds;
	},

	// public method to set the tracker point that we clicked, so that we can click it again to open the associated info-panel
	setTargetTracker: function (tracker) {
		this._targetTracker = tracker; 
	},
});

export default LeafletBackButton