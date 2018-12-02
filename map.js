mapboxgl.accessToken = "pk.eyJ1IjoicmVwcmljZSIsImEiOiJjanA0eDRhNXIwbTk5M29wN2MwM2owcDQ5In0.gbdqFh77Q8t0lfwBYmKnfg";

$426Map = new function() {

    this.airports = [];
    this.map = undefined;
    this.markers = [];
    this.paths= [];
    this.popups = [];

    this.clear = () => {}

    this.add_paths = function(id) {

        if (this.airports == null || this.airports.length < 2) {
            return false;
        } else if (typeof(id) !== "number") {
            return -1;
        }

        let arcs = {};
        const ARC_TICKS = 125;
        let features = [];
        let longLatSrc = {
            "x": $426Airports.get_long(id),
            "y": $426Airports.get_lat(id)
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
                "line-width": 5,
            }
        }

        for (const ident of this.airports) {

            if (ident === id) {
                continue;
            }

            let gen = new arc.GreatCircle(longLatSrc, {
                "x": $426Airports.get_long(ident),
                "y": $426Airports.get_lat(ident),
            });
            arcs[ident] = gen.Arc(ARC_TICKS, {"offset": 10}).geometries[0].coords, 

            features.push({
                "geometry": {
                    "type": "LineString",
                    "coordinates": [],
                },
                "properties": {
                    "idDest": ident,
                    "idSrc": id
                },
                "type": "Feature",
            });

        }

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

        //https://www.mapbox.com/mapbox.js/example/v1.0.0/animating-flight-paths/

    }

    this.add_airports = function(airports) {

        if (!Array.isArray(airports)) {
            return -1;
        }

        for (let ident of airports) {

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
            this.airports.push(+ident);

        }

        return true;

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
