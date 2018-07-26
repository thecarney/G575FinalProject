/* ATTRIBUTIONS */

// call initialize function after page ready
$(document).ready(initialize);

// starting point for script
function initialize() {

    // enable bootstrap tooltips
    $(function () {
        $('[data-toggle="tooltip"]').tooltip()
    });

    // show splash screen on page load
    //$("#splashModal").modal('show');

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
    let defaultLG;
    let majorLG;
    let moderateLG;
    let minorLG;
    let markerHighlightLG = L.layerGroup().addTo(map);
    let currentlyActiveLG;
    let severityTag = "tot_floods";

    // vars for managing Decade Slider tool and status
    let jsonResponse;
    let decadeArray;
    let decadeIndex = 0;
    let decadeSlider;
    let decadeToolStatus = 0;
    let oldValDecade = [1900,1909];

    // vars for managing Flood Count Slider tool and status
    let rangeFilter;
    let filterToolStatus = 0;
    let oldValFilter = [0,40];
    let topCaller = "none";  // all, maj, mod, min, none
    let filterLayer;



    // async load xmlhttprequest object of json data type
    $.ajax("data/state.geojson", {
        dataType: "json",
        success: function(response){

            // store response
            jsonResponse = response;

            // create legend
            createLegend(map);

        }
    });

    // create temporal legend
    function createLegend() {
        let LegendControl = L.Control.extend({
            options: {
                position: 'bottomright'
            },
            onAdd: function (map) {
                // container
                let container = L.DomUtil.create('div', 'legend-control-container');
                // temporal
                $(container).append('<div class="btn-dark" id="temporal-legend">');
                // attribute
                let svg = '<svg class="figure" id="attribute-legend" width="160px" height="60px">';
                // circles
                var circles = {
                    max: 20,
                    mean: 40,
                    min: 60
                };
                // loop to add svg
                for (var circle in circles){
                    svg += '<circle class="legend-circle" id="' + circle + '" fill="#F47821" fill-opacity="0.8" stroke="#000000" cx="30"/>';
                    svg += '<text id="' + circle + '-text" x="65" y="' + circles[circle] + '"></text>';
                };
                svg += "</svg>";
                $(container).append(svg);
                return container;
            }
        });
        map.addControl(new LegendControl());
    }

    // update svg legend
    function updateLegend(){
        //get the max, mean, and min values as an object
        var circleValues = getCircleValues(map);

        for (let key in circleValues) {
            // radius
            let radius = calcPropRadius(circleValues[key]);
            // fill
            let fill = getLegendColor();
            // assign the cy and r attributes
            $('#'+key).attr({
                cy: 59 - radius,
                r: radius,
                fill: fill
            });
            // legend text
            $('#'+key+'-text').text(Math.round(circleValues[key]*100)/100 + " floods");
        }
    };

    // make array of attributes (fields) with "d_" in the name (# floods by decades)
    function processData(data) {
        // make array
        let attributesArray = [];
        // get properties of feature 1
        let properties = data.features[0].properties;
        // populate array
        for (let field in properties) {
            // only get attributes with pop
            if (field.indexOf("d_") > -1) {
                attributesArray.push(field);
            };
        };
        return attributesArray;
    }



    // marker styling and proportial symbols, this is called for each feature from createPropSymbols
    function pointToLayer(feature, latlng, tag) {
        //make a style for markers
        let geojsonMarkerOptions = defaultMarkerOptions();
        // marker
        let marker = L.circleMarker(latlng, geojsonMarkerOptions);

        // new radius
        let radius = calcPropRadius(Number(feature.properties[tag]));
        marker.setRadius(radius);

        // make popup
        let popupContent = "<b>"+feature.properties.city + "</b> showing " + "<b>" + feature.properties.tot_floods + "</b> floods.";
        marker.bindPopup(popupContent, {
            offset: new L.Point(0,-geojsonMarkerOptions.radius),
            closeButton: false
        });
        // add listeners for hover popup and info panel
        addListeners(marker);
        // return the marker to the caller to be added to map
        return marker;
    };

    // called on creation of each marker to add listeners to it
    function addListeners (marker){
        let markerOptions = {
            radius: marker.getRadius()*1.25,
            fillColor: "#000000",
            color: "#df00cd",
            weight: 4,
            opacity: 1,
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
                // populate the "Community Overview" info panel with desc of clicked marker
                // city name
                let city =
                    "<b>"+marker.feature.properties.city + "</b>" + "<i> (" + marker.feature.properties.pronunciation + ")</i>";
                $("#city").html(city);
                // watershed
                let shed =
                    "HUC12: <i>" + marker.feature.properties.watershed + "</i>";
                $("#shed").html(shed);
                // desc
                let desc =
                    "<p>" + marker.feature.properties.desc + "</p>";
                $("#desc").html(desc);

                // clear old highlight
                markerHighlightLG.clearLayers();
                // add new highlight
                L.circleMarker(marker.getLatLng(),markerOptions).addTo(markerHighlightLG);

                //bar chart
                let maj = Number(marker.feature.properties.tot_sev_major);
                let mod = Number(marker.feature.properties.tot_sev_moderate);
                let min = Number(marker.feature.properties.tot_sev_minor);
                let tot = Number(marker.feature.properties.tot_floods);
                let und = tot - (maj + mod + min);
                let data = [maj, mod, min, und, tot];
                makeBarChart(data);

            }
        });
    };

    // for circle markers
    function  defaultMarkerOptions() {
        let colorAll = "#138db8";
        let colorMaj = "#e31a1c";
        let colorMod = "#fd8d3c";
        let colorMin = "#fecc5c";
        let colorCurrent;

        switch (currentlyActiveLG) {
            case defaultLG:
                colorCurrent = colorAll;
                break;
            case majorLG:
                colorCurrent = colorMaj;
                break;
            case moderateLG:
                colorCurrent = colorMod;
                break;
            case minorLG:
                colorCurrent = colorMin;
                break;
        }

        return {
            radius: 6,
            fillColor: colorCurrent,
            color: "#000",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.6
        };
    }

    // for legend svg color
    function  getLegendColor() {
        let colorAll = "#138db8";
        let colorMaj = "#e31a1c";
        let colorMod = "#fd8d3c";
        let colorMin = "#fecc5c";
        let colorCurrent;

        switch (currentlyActiveLG) {
            case defaultLG:
                colorCurrent = colorAll;
                break;
            case majorLG:
                colorCurrent = colorMaj;
                break;
            case moderateLG:
                colorCurrent = colorMod;
                break;
            case minorLG:
                colorCurrent = colorMin;
                break;
        }

        return colorCurrent;
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

        // force Leaflet redraw
        map.invalidateSize();
    }).trigger("resize");
}


