/* ATTRIBUTIONS */

// call initialize function after page ready
$(document).ready(initialize);

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

}

// Main script. All functions except "resize" are within map(). This main function returns the map object to allow the
// resize function to work.
function map() {

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
        zoom: 4,
        layers: [bmLight]
    });

    // add basemap control
    L.control.layers(bmGroup, null, {position: 'topleft'}).addTo(map);

    // declare data layerGroups
    let stateLG;  // for state outlines
    let monumentLG;  // points for monuments
    let monumentHighlightLG = L.layerGroup().addTo(map);  // can use to highlight a clicked point

        // async load xmlhttprequest object of json data type
    $.ajax("data/monument.json", {
        dataType: "json",
        success: function(response1){

            $.ajax("data/state.json", {
                dataType: "json",
                success: function(response2){

                    // make markers
                    monumentLG = createMarkerLayer(response1);
                    stateLG = L.geoJSON(response2);

                    // add layers
                    monumentLG.addTo(map);
                    stateLG.addTo(map);

                    // create legend
                    createLegend(map);

                }
            });
        }
    });

    // parent function to make point features
    function createMarkerLayer(data){
        // iterate through all features in json
        return L.geoJson(data, {
            // for each feature, call function to vectorize it
            pointToLayer: function (feature, latlng) {
                return pointToLayer(feature, latlng);
            }
        });
    }

    // create temporal legend
    function createLegend() {
        let LegendControl = L.Control.extend({
            options: {
                position: 'bottomleft'
            },
            onAdd: function (map) {
                // container
                let container = L.DomUtil.create('div', 'legend-control-container');
                return container;
            }
        });
        map.addControl(new LegendControl());
    }

    // marker styling and proportial symbols, this is called for each feature from createPropSymbols
    function pointToLayer(feature, latlng) {
        //make a style for markers
        let geojsonMarkerOptions = defaultMarkerOptions();
        // marker
        let marker = L.marker(latlng);

        // make popup
        let popupContent = "<b>"+feature.properties.name;
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
                // add zoom and story map tie in


                // clear old highlight
                monumentHighlightLG.clearLayers();

                // add new highlight
                L.circleMarker(marker.getLatLng(),markerOptions).addTo(monumentHighlightLG);
            }
        });
    }

    // for circle markers
    function  defaultMarkerOptions() {
        let colorAll = "#138db8";
        let colorCurrent = colorAll;

        return {
            radius: 6,
            fillColor: colorCurrent,
            color: "#000",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.6
        };
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

        // set new map height
        let newMapHeight = windowHeight - navbarHeight - footerHeight;
        $("#map").css({"height": newMapHeight});

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


