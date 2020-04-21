// Store the API endpoint inside queryUrl and queryPlatesUrl 
var queryUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson"
var queryPlatesUrl = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json"

// Perform a GET request to the query URL, pull data for quakes
d3.json(queryUrl, function(data) {
    console.log(data.features);

    // 
    tectonicPlates(data.features);
});

// Perform a GET request to the query URL, pull data for plates
function tectonicPlates(platesData) {
    d3.json(queryPlatesUrl, function(data) {


        createFeatures(platesData, data.features);
    });
}

// Reflect the magnitude of the earthquake in color 
function magnitudeColor(magnitude) {
    switch (true) {
        case magnitude >= 5:
            return '#d35400';
        case magnitude >= 4:
            return '#e67e22';
        case magnitude >= 3:
            return '#f39c12';
        case magnitude >= 2:
            return '#f5b041';
        case magnitude >= 1:
            return '#f7dc6f';
        default:
            return '#7dcea0';
    };
};


// Reflect the magnitude of the earthquake in size 
function magnitudeSize(magnitude) {
    return magnitude * 30000;
};

// Create Features
function createFeatures(earthquakeData, rockData) {

    // For each feature, create a popup to display place, time and magnitude of each earthquake
    function onFeature(feature, layer) {
        layer.bindPopup("<h3>" + feature.properties.place +
            "</h3><hr><p>" + new Date(feature.properties.time) +
            "</p><hr><p>" + "<h3>Magnitude: " + feature.properties.mag + "</h3>")

    };
    //Create a GeoJSON layer containing the features array on the earthquakeData object
    var earthquakes = L.geoJSON(earthquakeData, {

        onEachFeature: onFeature,

        pointToLayer: function(feature, latlng) {
            return L.circle(latlng, {
                radius: magnitudeSize(feature.properties.mag),
                fillColor: magnitudeColor(feature.properties.mag),
                fillOpacity: 0.8,
                color: "#000000",
                weight: 0.5
            })
        }

    });


    // Create a GeoJSON layer containing the rockData
    var faultLines = L.geoJson(rockData, {
        style: function(feature) {
            var latlngs = (feature.geometry.coordinates);
            return L.polyline(latlngs);
        }
    });

    createMap(earthquakes, faultLines);
};

function createMap(earthquakes, faultLines) {

    // Define satellite, grayscale and outdoors layers
    var satellite = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
        attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
        maxZoom: 18,
        id: "mapbox.satellite",
        accessToken: API_KEY
    });

    var grayscale = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
        attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
        maxZoom: 18,
        id: "mapbox.streets",
        accessToken: API_KEY
    });

    var outdoors = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
        attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
        maxZoom: 18,
        id: "mapbox.outdoors",
        accessToken: API_KEY
    });

    // Define a baseMaps object to hold our base layers
    var baseMaps = {
        "Satellite": satellite,
        "Grayscale": grayscale,
        "Outdoors": outdoors
    };

    // Define a baseMaps object to hold our base layers
    var overlayMaps = {
        Earthquakes: earthquakes,
        FaultLines: faultLines
    };

    // Create a new map
    var myMap = L.map("map", {
        center: [15.00, -20.00],
        zoom: 2.5,
        layers: [satellite, grayscale, outdoors, earthquakes, faultLines]
    });

    // Create a layer control containing our baseMaps
    //And the overlay Layer containing the earthquake GeoJSON 
    L.control.layers(baseMaps, overlayMaps).addTo(myMap);


    // Set up the legend
    var legend = L.control({ position: 'bottomright' });

    legend.onAdd = function() {

        var div = L.DomUtil.create('div', 'info legend'),

            // Define the the scale of the earthquake for the legend
            magnitude_scale = [0, 1, 2, 3, 4, 5];


        // Add a row to the legend for each "magnitude_scale"
        for (var i = 0; i < magnitude_scale.length; i++) {

            div.innerHTML +=
                '<i style="background:' + magnitudeColor(magnitude_scale[i]) + '"></i> ' +
                magnitude_scale[i] + (magnitude_scale[i + 1] ? '&ndash;' + magnitude_scale[i + 1] + '<br>' : '+');

        }
        return div;
    };

    // Adding legend to the map
    legend.addTo(myMap);
}