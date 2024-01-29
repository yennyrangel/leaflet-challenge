// create the tile layers for the backgrounds of the map
let defaultMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

// water color layer
let waterColor = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.{ext}', {
	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	subdomains: 'abcd',
	minZoom: 1,
	maxZoom: 16,
	ext: 'jpg'
});
// topography
let topoMap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
	maxZoom: 17,
	attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
});

// make a basemaps object
let basemaps = {
    "Water Color": waterColor,
    "Topography": topoMap
};

// make a map object
let myMap = L.map("map", {
    center: [36.7783, -119.4179],
    zoom: 3.4,
    layers: [waterColor, topoMap]
});

// add the default map to the map
defaultMap.addTo(myMap);
// get the data for the tectonic plates and draw on the map
// variable to hold the tectonic plates layer
let tectonicplates = new L.layerGroup();
// call the api to get the info for the tectonic plates
d3.json("https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json")
.then(function(plateData){
    // console log to make sure the data loaded
    // console.log(plateData);
    // load data using geoJson and add to the tectonic plates layer group
    L.geoJson(plateData,{
        // add styling to make the lines visible
        color: "yellow",
        weight: 1
    }).addTo(tectonicplates);
});
// add the tectonic plates to the map
tectonicplates.addTo(myMap);
// variable to hold the earthquake data layer
let earthquakes = new L.layerGroup();

// set up the intervals
let intervals = [-10, 10, 30, 50, 70, 90];
// set the colors for the intervals
let colors = [
    "green",
    "#CAFC03",
    "#FFFF00",
    "#FFD700",
    "#FFA500",
    "#FF6347"
];
// get the data for the earthquakes and populate the layergroup
// call the USGS GeoJson API
d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson")
.then(
    function(earthquakeData){
        // console log to make sure the data loaded
        console.log(earthquakeData);
        // plot circles, where the radius is dependent on the magnitude
        // and the color is dependent on the depth
        // make a function that chooses the color of the data point
        
        function dataColor(depth) {
            let normalizedDepth = (depth - intervals[0]) / (intervals[intervals.length - 1] - intervals[0]);
            normalizedDepth = Math.max(0, Math.min(normalizedDepth, 1));
            let colorIndex = Math.floor(normalizedDepth * (colors.length - 1));
            colorIndex = Math.max(0, Math.min(colorIndex, colors.length - 1));
            let calculatedColor = colors[colorIndex];
            return calculatedColor;
            } 
        
        // make a function that determines the size of the radius
        function radiusSize(mag){
            if (mag == 0)
                return 1; // makes sure that a 0 mag earthquake shows up
            else
                return mag * 5; // makes sure that the circle is pronounced in the map
        }
        // add on to the style for each data point
        function dataStyle(feature)
        {
            return {
                opacity: 0.5,
                fillOpacity: 0.5,
                fillColor: dataColor(feature.geometry.coordinates[2]), // use index 2 for the depth
                color: "000000", // black outline
                radius: radiusSize(feature.properties.mag), // grabs the magnitude
                weight: 0.5,
                stroke: true
            }
        }
        // add the GeoJson Data to the earthquake layer group
        L.geoJson(earthquakeData, {
            // make each feature a marker that is on the map, each marker is a circle
            pointToLayer: function(feature, latLng) {
                return L.circleMarker(latLng);
            },
            // set the style for each marker
            style: dataStyle, // calls the data style function and passes in the earthquake data
            // add popups
            onEachFeature: function(feature, layer){
                layer.bindPopup(`Magnitude: <b>${feature.properties.mag}</b><br>
                                Depth: <b>${feature.geometry.coordinates[2]}</b><br>
                                Location: <b>${feature.properties.place}</b>`);
            }
        }).addTo(earthquakes);
        earthquakes.addTo(myMap);
    }
);
// add the earthquake layer to the map
// add the overlay for the tectonic plates and for the earthquakes
let overlays = {
    "Tectonic Plates": tectonicplates,
    "Earthquake Data": earthquakes
};
// add the Layer control
L.control
    .layers(basemaps, overlays)
    .addTo(myMap);
// add the legend to the map
let legend = L.control({
    position: "bottomright" })
// add the properties for the legend
legend.onAdd = function() {
    // div for the legend to appear in the page
    let div = L.DomUtil.create("div", "info legend");
    console.log(div);
    div.style.backgroundColor = 'white';
    div.style.width = '70px'; 
    div.style.height = '110px';  

    // loop through the intervals and the colors and generate a label
    // with a colored square for each interval
    
        for (let i = 0; i < colors.length; i++) {
            div.innerHTML +=
              '<div><span style="background:' + colors[i] + '; width: 13px; height: 13px; display: inline-block;"></span> ' +
              intervals[i] + (intervals[i + 1] ? '&ndash;' + intervals[i + 1] + '<br>' : '+');
          }  
        
    return div;
};
// add the legend to the map
legend.addTo(myMap);