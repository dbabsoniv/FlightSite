mapboxgl.accessToken = "pk.eyJ1IjoicmVwcmljZSIsImEiOiJjanA0eDRhNXIwbTk5M29wN2MwM2owcDQ5In0.gbdqFh77Q8t0lfwBYmKnfg";

$426Map = new function() {

    this.airports = [];
    this.airportSource;
    this.map = undefined;
    this.markers = [];
    this.paths = undefined;
    this.popups = [];

    this.clear = () => {
        this.map.removeLayer("paths");
        for (let i = 0; i < this.markers.length; ++i) {
            this.popups[i].remove();
            this.markers[i].remove();
        }
    }

    this.draw_paths = () => {

        if (
            this.airports == null
            || this.airports.length < 1
            || this.airportSource == null
        ) {
            return false;
        }

        let arcs = {};
        const ARC_TICKS = 125;
        // [[LONG_MIN, LAT_MIN], [LONG_MAX, LAT_MAX]]
        let bounds = [
            [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
            [Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER]
        ];
        let features = [];
        let longLatSrc = {
            "x": $426Airports.get_long(this.airportSource),
            "y": $426Airports.get_lat(this.airportSource)
        };
        let packet = {
            "type": "FeatureCollection",
            "features": features,
        }
        let layer = {
            "id": "paths",
            "type": "line",
            "source": {
                "type": "geojson",
                "data": packet,
            },
            "layout": {
                "line-cap": "round",
            },
            "paint": {
                "line-color": "#17A589",
                "line-width": 6,
            }
        }

        for (const ident of this.airports) {

            let lat = $426Airports.get_lat(ident);
            let lng = $426Airports.get_long(ident);

            if (lng < bounds[0][0]) {
                bounds[0][0] = lng;
            }
            if (lng > bounds[1][0]) {
                bounds[1][0] = lng;
            }
            if (lat < bounds[0][1]) {
                bounds[0][1] = lat;
            }
            if (lat > bounds[1][1]) {
                bounds[1][1] = lat;
            }

            let gen = new arc.GreatCircle(longLatSrc, {
                "x": lng,
                "y": lat,
            });
            arcs[ident] = gen.Arc(ARC_TICKS, {"offset": 10}).geometries[0].coords, 

            features.push({
                "geometry": {
                    "type": "LineString",
                    "coordinates": [],
                },
                "properties": {
                    "idDest": +ident,
                    "idSrc": this.airportSource
                },
                "type": "Feature",
            });

        }

        // The bound is too tight. Make it more loose.
        bounds[0][0] = (bounds[0][0] < -175) ? bounds[0][0] : bounds[0][0] - 5;
        bounds[0][1] = (bounds[0][1] < -88) ? bounds[0][1] : bounds[0][1] - 2;
        bounds[1][0] = (bounds[1][0] > 175) ? bounds[1][0] : bounds[1][0] + 5;
        bounds[1][1] = (bounds[1][1] > 88) ? bounds[1][1] : bounds[1][1] + 2;

        this.map.fitBounds(bounds);
        this.map.addLayer(layer);

        let i = 0;
        let animation;
        let animate = () => {

            for (let feat of layer["source"]["data"]["features"]) {
                feat["geometry"]["coordinates"].push(
                    arcs[feat["properties"]["idDest"]][i]
                );
            }
            this.map.getSource("paths").setData(packet);
            if (++i < ARC_TICKS) {
                animation = requestAnimationFrame(animate);
            }                
        }
        animate();
        this.paths = layer;

        return true;

    }

    this.draw_airports = (airports, source) => {

        if (!Array.isArray(airports)) {
            return -1;
        } else if (typeof(source) !== "boolean") {
            return -2;
        } else if (
            typeof(airports[0]) !== "number"
            && (typeof(airports[0]) === "string"
            && airports[0].search(/^\d+$/) < 0)
        ) {
            return -3;
        }

        let f = (ident) => {
            // Order of these operations matter.
            let el = document.createElement("div");
            el.className = "marker-airport";
            let marker = new mapboxgl.Marker({
                element: el
            });
            let popup = new mapboxgl.Popup({
                closeButton: false,
                className: "popup-airport",
            });
            popup.setText($426Airports.get_city(+ident));
            marker.setLngLat([
                $426Airports.get_long(+ident),
                $426Airports.get_lat(+ident)
            ]);
            marker.setPopup(popup);
            marker.addTo(this.map);
            this.markers.push(marker);
            this.popups.push(popup);

        }

        for (let ident of airports) {
            f(ident);
        }
        if (source && this.airportSource != null) {
            f(this.airportSource);
        }

        return true;

    }

    this.get_airports = () => { return this.airports; }
    this.get_airportSource = () => { return this.airportSource; }
    this.get_map = () => () => { return this.map; }

    this.set_airports = (airports) => {

        if (!Array.isArray(airports)) {
            return -1;
        } else if (
            typeof(airports[0]) !== "number"
            && (typeof(airports[0]) === "string"
            && airports[0].search(/^\d+$/) < 0)
        ) {
            return -2;
        }

        this.airports = airports;

        return true;

    }

    this.set_airportSource = (source) => {
        
        if (typeof(source) === "number") {
            this.airportSource = source;
            return true;
        } else {
            return false;
        }

    }

}

let map_pointer = function(e) {
    $("canvas.mapboxgl-canvas").toggleClass("pointer");
}

// Only load the map if testing the map directly.
// There is an API limit.
/*
$(document).ready(() => {

    $426Map.map = new mapboxgl.Map({
        container: "map",
        style: "mapbox://styles/mapbox/light-v9",
        center: [-99.9995795, 48.3552767],
        zoom: 4,
    });

    $426Map.map.on("click", "paths", (e) => {
        console.log(e.features[0].properties.idSrc);
        console.log(e.features[0].properties.idDest);
    });
    $426Map.map.on("mouseenter", "paths", map_pointer);
    $426Map.map.on("mouseleave", "paths", map_pointer);

});
*/
