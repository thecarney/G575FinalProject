/* ATTRIBUTIONS */

// call initialize function after page ready
$(document).ready(initialize);

//container margins and scroll- credit to Jack Dougherty at DataVizforAll
var imageContainerMargin = 70;  // Margin + padding
	// This watches for the scrollable container
	var scrollPosition = 0;
	$('div#contents').scroll(function() {
		scrollPosition = $(this).scrollTop();
	});


// starting point for script
function initialize() {

    // enable bootstrap tooltips
    $(function () {
		$('[data-toggle="tooltip"]').tooltip();

    });

    // show splash screen on page load
    $("#splashModal").modal('show');

    // resize function wraps the main function to allow responsive sizing
    resize(map());

};

// Main script. All functions except "resize" are within map(). This main function returns the map object to allow the
// resize function to work.

function map() {
    // track lat-lon of last marker clicked
    let lastClickedMarkerLatLon = L.latLng(75,125); //dummy initial data

    // basemaps
    let bmStreets = L.tileLayer('https://api.mapbox.com/styles/v1/jhcarney/cjk1yuwd6b9mv2sqvu8452gfu/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiamhjYXJuZXkiLCJhIjoiY2pmbHE2ZTVlMDJnbTJybzdxNTNjaWsyMiJ9.hoiyrXTX3pOuEExAnhUtIQ', {
        maxZoom: 18
	});
    let bmSatelliteStreets = L.tileLayer('https://api.mapbox.com/styles/v1/jhcarney/cjk1ywa89015v2sqks2r6ivwj/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiamhjYXJuZXkiLCJhIjoiY2pmbHE2ZTVlMDJnbTJybzdxNTNjaWsyMiJ9.hoiyrXTX3pOuEExAnhUtIQ', {
        maxZoom: 18
    });
    let bmLight = L.tileLayer('https://api.mapbox.com/styles/v1/jhcarney/cjk1yvox82csb2rlk24kxg3o2/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiamhjYXJuZXkiLCJhIjoiY2pmbHE2ZTVlMDJnbTJybzdxNTNjaWsyMiJ9.hoiyrXTX3pOuEExAnhUtIQ', {
        maxZoom: 18
	});
    let bmVintage = L.tileLayer('https://api.mapbox.com/styles/v1/jhcarney/cjk1yu1tqb9m22sqvp9zo8bc1/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiamhjYXJuZXkiLCJhIjoiY2pmbHE2ZTVlMDJnbTJybzdxNTNjaWsyMiJ9.hoiyrXTX3pOuEExAnhUtIQ', {
        maxZoom: 18
    });

    // basemap group
    let bmGroup = {
        "Streets": bmStreets,
        "Aerial": bmSatelliteStreets,
        "Light": bmLight,
        "Vintage": bmVintage
    };

    // map, add one basemap
    var map = map = L.map('map',{
        center: [36.8123, -86.0389],
        zoom: 5,
        layers: [bmLight]
    });

    // add button to reset map position
    L.easyButton({
        states:[
            {
                icon: 'fa-sync',
                title: 'Reset View',
                onClick: function (btn, map) {
                    $("#btnScrollUp")[0].click();
                    var ctr = [36.8123, -86.0389];
                    map.setView(ctr, 5);
                }
            }
            ]
        }).addTo(map);
    // }, function(btn, map){
    //     var ctr = [36.8123, -86.0389];
    //     map.setView(ctr,5);
    //     $("#btnScrollUp")[0].click();
    //}).addTo(map);

    // declare data layerGroups
    let stateLG = L.layerGroup();  // for state outlines
    let monumentLG = L.layerGroup();  // points for monuments
	let monumentHighlightLG = L.layerGroup().addTo(map);  // can use to highlight a clicked point

	// async load xmlhttprequest object of json data type			   
	$.ajax("data/monument.json", {
        dataType: "json",
        success: function(response1){

            // make markers
            monumentLG = createMarkerLayer(response1);
            //monumentLG.bringToBack();

            // add layers
            monumentLG.addTo(map);

            // create legend
            createLegend(map);


            // $.ajax("data/state.json", {
            //     dataType: "json",
            //     success: function(response2){
            //
            //
            //         stateLG = L.geoJSON(response2);
            //
            //
			// 		//statesLG.addTo(map;)
            //
            //
            //
            //     }
            // });
        }
    });
	
		
	// cycle through states geojson to get an array for layer control *likely duplicate of ajax call so I removed the ajax addtomap for states*
    //     concur. further edits to ajax call above. delete commented out code if it all looks ok
    
    //Feature search
    var search = new L.Control.Search({
      layer: monumentLG,
      propertyName: 'name',
      circleLocation:false,
      collapsed:true,
      textPlaceholder:'Search Monument Names',
      zoom:'15'});
    search.on('search_locationfound', function() { map.setZoom(18); });
    search.on ('search_locationfound', function(e) {
        e.layer.fire('click');
        search.collapse();
      });
    map.addControl(search);   

    // create legend function
    function createLegend() {
    let LegendControl = L.Control.extend({
    options: {
    position: 'bottomleft'
    },
    onAdd: function (map) {
    // container
    let container = L.DomUtil.create('div', 'legend-control-container'),
    icon1 = ["Confederate Monuments"],
    icon2 = ["States with Removed Monuments"]
    label1 = ["img/monument.png"]
    label2 = ["img/states.png"];

    container.innerHTML = (" <img src=" + label1[0] + " height='20' width='20'>") + " " + icon1[0] + '<br>' + (" <img src=" + label2[0] + " height='20' width='20'>") + " " + icon2[0] + '<br>';

    return container;
    }
    });
    map.addControl(new LegendControl());
    }
    
	jQuery.getJSON("data/state.json", function(json){
		L.geoJSON(json, {
			onEachFeature: addMyData,
			style: function(json) {
				switch (json.properties.hasRemoved) {
					case 1: return {color: "#ffff00"};
					case 0: return {color: "#bababa"};}}		
 		})
	});
	
    //add states to layer control
	function addMyData(feature, layer){
		stateLG.addLayer(layer);
	};
		
	var overlayMaps = {
		"State Boundary": stateLG			
	};
	
	// add basemap control
    L.control.layers(bmGroup, overlayMaps, {position: 'topleft'}).addTo(map);
	

    // parent function to make point features
    function createMarkerLayer(data){
        // iterate through all features in json
        return L.geoJson(data, {
            // for each feature, call function
            pointToLayer: function (feature, latlng) {
                return pointToLayer(feature, latlng);
            }
        });
    }
    
	//story map boilerplate script - credit to Jack Dougherty at DataVizforAll
	//get map data for targeted features
    $.getJSON('data/map.geojson', function(data) {
        var geojson = L.geoJson(data, {
            onEachFeature: function (feature, layer) {
                (function(layer, properties) {
                  // This creates numerical icons to match the ID numbers
                  // OR remove the next 6 lines for default blue Leaflet markers
                    var numericMarker = L.ExtraMarkers.icon({
                      icon: 'fa-number',
                      number: feature.properties['id'],
                      markerColor: 'yellow'
                    });

                    layer.setIcon(numericMarker);

                    // This creates the contents of each chapter from the GeoJSON data. Unwanted items can be removed, and new ones can be added
                    var chapter = $('<p></p>', {
                      text: feature.properties['chapter'],
                      class: 'chapter-header'
                    });


                    var source = $('<a>', {
                      text: feature.properties['source-credit'],
                      href: feature.properties['source-link'],
                      target: "_blank",
                      class: 'source'
                    });

                    var image = $('<img>', {
                      alt: feature.properties['alt'],
                      src: feature.properties['image']
                    });

                    var source = $('<a>', {
                      text: feature.properties['source-credit'],
                      href: feature.properties['source-link'],
                      target: "_blank",
                      class: 'source'
                    });

                    var description = $('<p></p>', {
                      text: feature.properties['description'],
                      class: 'description'
                    });

                    var container = $('<div></div>', {
                      id: 'container' + feature.properties['id'],
                      class: 'image-container'
                    });

                    var imgHolder = $('<div></div>', {
                      class: 'img-holder'
                    });

                    imgHolder.append(image);

                    container.append(chapter).append(imgHolder).append(source).append(description);
                    $('#contents').append(container);


                    var i;
                    var areaTop = -90;
                    var areaBottom = 0;

                    // Calculating total height of blocks above active
                    for (i = 1; i < feature.properties['id']; i++) {
                      areaTop += $('div#container' + i).height() + imageContainerMargin;
                    }

                    areaBottom = areaTop + $('div#container' + feature.properties['id']).height();

                    $('div#contents').scroll(function() {
                        if ($(this).scrollTop() >= areaTop && $(this).scrollTop() < areaBottom) {
                            $('.image-container').removeClass("inFocus").addClass("outFocus");
                            $('div#container' + feature.properties['id']).addClass("inFocus").removeClass("outFocus");
                             map.flyTo([feature.geometry.coordinates[1], feature.geometry.coordinates[0] ], feature.properties['zoom']);
                        }
                    });

                    // Make markers clickable
                    layer.on('click', function() {
                      $("div#contents").animate({scrollTop: areaTop + "px"});
                    });

                    // make popup
                    let storyPopup = "<p><b>Read more about " + feature.properties.chapter+"."+"</p>";
                    layer.bindPopup(storyPopup, {
                        closeButton: false
                    });

                    // popup listeners
                    layer.on({
                        mouseover: function () {
                            this.openPopup()
                        },
                        mouseout: function () {
                            this.closePopup();
                        }
                    });


                })(layer, feature.properties);
            }
        });

        $('div#container1').addClass("inFocus");
        $('#contents').append("<div class='space-at-the-bottom'><a href='#space-at-the-top' id='btnScrollUp'><i class='fa fa-chevron-up'></i></br><small>Top</small></a></div>");

        //listener for "top" button
        // $("#btnScrollUp").click(function(event){
        //     var ctr = [36.8123, -86.0389];
        //     map.setView(ctr, 5);
        // });

        //listener for "top" button to reset story map too
        $("#btnScrollUp").click(function(event){
            setTimeout(function () {
                var ctr = [36.8123, -86.0389];
                map.setView(ctr, 5);
            },250);
        });


	geojson.addTo(map);
    });


    // marker styling and proportial symbols, this is called for each feature from createPropSymbols
    function pointToLayer(feature, latlng) {
        //make a style for markers
        let geojsonMarkerOptions = defaultMarkerOptions();
        // marker
        let marker = L.circleMarker(latlng, geojsonMarkerOptions);

        // make popup
        let popupContent = "<p><b>"+feature.properties.name+ ". This monument recognizes " + feature.properties.honoree+"."+"</p>";
        marker.bindPopup(popupContent, {
            closeButton: false
        });
        // add listeners for hover popup
        addListeners(marker);
        // return the marker to the caller
        return marker;
    }

    // called on creation of each marker to add listeners to it
    function addListeners (marker){
        // marker options for highlight
        let markerOptions = {
            radius: 6,
            color: "#df00db",
            weight: 11,
            opacity: .75,
            fillOpacity: 0
        };

        marker.on({
            mouseover: function(){
                this.openPopup()
            },
            mouseout: function(){
                this.closePopup();
            },
            click: function () {
                // clear/highlight clicked markers
                if (lastClickedMarkerLatLon.equals(marker.getLatLng())) {
                    // clear old highlight
                    monumentHighlightLG.clearLayers();
                } else {
                    // clear old highlight
                    monumentHighlightLG.clearLayers();
                    // add new highlight
                    L.circleMarker(marker.getLatLng(),markerOptions).addTo(monumentHighlightLG).bringToBack();
                }

                // update tracking var
                lastClickedMarkerLatLon = marker.getLatLng();
            }
        });
    }

    // for circle markers
    function defaultMarkerOptions() {
    let defIcon = L.icon({
    iconUrl: "img/monument.png",
    iconSize: [10, 10],
    iconAnchor: [8, 8],
    popupAnchor: [0, 0],
    //shadowUrl: 'my-icon-shadow.png',
    //shadowSize: [68, 95],
    //shadowAnchor: [22, 94]
    });

    return defIcon;
    }

    // return map object
    return map;
}

function resize(map) {
    // window resize listener
    $(window).on("resize", function () {

        // make map height responsive to available space
        //   get heights
        let navbarHeight = $("#header1").outerHeight();
        let footerHeight = $("#footer").outerHeight();
        let windowHeight = $(window).outerHeight();
        let storyMapHeaderHeight = $("#storyMapTitleBlock").outerHeight();

        // set new map height
        let newMapHeight = windowHeight - navbarHeight - footerHeight;
        $("#map").css({"height": newMapHeight});

        // set new storymap panel height
        let newStoryMapHeight = windowHeight - navbarHeight - footerHeight - storyMapHeaderHeight -15;
        $("#story").css({"height": newStoryMapHeight});

        // adjust body padding
        $('body').css({"padding-top": navbarHeight});

        // shrink title and footer font size on mobile devices
        let result = $('#device-size-detector').find('div:visible').first().attr('id');
        if (result === "xs") {
            $("#appTitle").css({"font-size": "0.75em"});
            $("#footerText").css({"font-size": "0.75em"});
        } else {
            $("#appTitle").css({"font-size": "1em"});
            $("#footerText").css({"font-size": "1em"});
        }

        // force Leaflet redraw
        map.invalidateSize();
    }).trigger("resize");
}