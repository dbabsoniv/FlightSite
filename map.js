// MAP.JS //
$426Map = new function() {

    this.LINE_COLOR = "#17A589";
    this.LINE_WIDTH = 5;

    this._airports = [];
    this._airportSource;
    this._map = undefined;
    this._markers = {};
    this._paths = null;
    this._pathActive = null;
    this._popups = [];
    this._reverse = false;

    // Clears the map of all lines, markers, and popups.
    this.clear = () => {

        if (this._paths != null) {
            this._map.removeLayer("paths");
            this._paths = null;
        }
        for (const popup of this._popups) {
            popup.remove();
        }
        Object.keys(this._markers).forEach((key) => {
            this._markers[key].remove();
        });
        this._popups = [];
        this._markers = {};
    }

    // Draws paths from this._airportSource to all airports in
    // this._airports.
    this.draw_paths = () => {

        let airports = this.get_airports();

        if (
            airports == null
            || airports < 1
            || airports == null
        ) {
            return false;
        }

        this._paths = null;

        let arcs = {};
        const ARC_TICKS = 125;
        // [[LONG_MIN, LAT_MIN], [LONG_MAX, LAT_MAX]]
        let aslo = $426Airports.get_long(this._airportSource);
        let asla = $426Airports.get_lat(this._airportSource);
        let bounds = [
            [aslo, asla],
            [aslo, asla]
        ];
        let features = [];
        let longLatSrc = {
            "x": aslo,
            "y": asla
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
                "line-color": ["get", "color"],
                "line-width": ["get", "width"]
            }
        }

        for (const ident of airports) {

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

            let gen = undefined;
            if (this.get_reverse()) {
                gen = new arc.GreatCircle({
                    "x": lng,
                    "y": lat,
                }, longLatSrc
                );
            } else {
                gen = new arc.GreatCircle(longLatSrc, {
                    "x": lng,
                    "y": lat,
                });

            } 
            arcs[ident] = gen.Arc(
                ARC_TICKS, {"offset": 10}
            ).geometries[0].coords;

            let dest = undefined;
            let src = undefined; 
            if (this.get_reverse()) {
                dest = this.get_airportSource();
                src = +ident;
            } else {
                dest = +ident;
                src = this.get_airportSource();
            }

            features.push({
                "geometry": {
                    "type": "LineString",
                    "coordinates": [],
                },
                "properties": {
                    "color": $426Map.LINE_COLOR,
                    "idDest": dest,
                    "idSrc": src,
                    "width": $426Map.LINE_WIDTH,
                },
                "type": "Feature",
            });

        }

        // The bound is too tight. Make it more loose.
        bounds[0][0] = (bounds[0][0] < -179) ? bounds[0][0] : bounds[0][0] - 1;
        bounds[0][1] = (bounds[0][1] < -89) ? bounds[0][1] : bounds[0][1] - 1;
        bounds[1][0] = (bounds[1][0] > 179) ? bounds[1][0] : bounds[1][0] + 1;
        // This one is higher to avoid the controls UI.
        bounds[1][1] = (bounds[1][1] > 85) ? bounds[1][1] : bounds[1][1] + 5;

        if (this._map.getSource("paths")) {
            this._map.removeSource("paths");
        }
        if (this._map.getLayer("paths")) {
            this._map.removeLayer("paths");
        }

        this._map.fitBounds(bounds);
        this._map.addLayer(layer);

        let i = 0;
        let animation;
        let animate = () => {

            let propWhere= undefined; 
            if (this.get_reverse()) {
                propWhere = "idSrc";
            } else {
                propWhere = "idDest";
            }
            
            for (let feat of layer["source"]["data"]["features"]) {
                feat["geometry"]["coordinates"].push(
                    arcs[feat["properties"][propWhere]][i]
                );
            }
            this._map.getSource("paths").setData(packet);
            if (++i < ARC_TICKS) {
                animation = requestAnimationFrame(animate);
            }
        }
        animate();
        this._paths = layer;

        return true;

    }

    /*
     *  Draws airport markers and associated popups on the map.
     *
     *  This method doesn't clear anything. It is up to the caller to
     *  clear the map before calling this function, if that is the
     *  callers intensions.
     *
     *  Parameters
     *  ----------
     *  airports    : (Array of Numbers - Integers OR an Array of
     *                Strings composed of digit characters)
     *                An array of airport IDs. These airports will
     *                be drawn on the map.
     *
     *  Returns
     *  -------
     *  -1  : airports is not an array
     *  -2  : airports is not composed of integers, whether they be
     *        represented by numbers or strings..
     *  true: airports were drawn onto the map.
     */
    this.airports_draw = (airports) => {

        if (!Array.isArray(airports)) {
            return -1;
        } else if (
            typeof(airports[0]) !== "number"
            && (typeof(airports[0]) === "string"
            && airports[0].search(/^\d+$/) < 0)
        ) {
            return -2;
        }

        let color = "#0000FF";
        if (this.get_reverse()) {
            color = "#FF0000";
        }
        for (let ident of airports) {
           this._airport_draw(ident, color);
        }

        return true;

    }

    // Helper function. Don't call this.
    // Call this.airport_draws() or this.airport_drawSource() instead.
    this._airport_draw  = (ident, color) => {

            if (color == null || color === "") {
                color = "#0000FF";
            }

            // Order of these operations matter.
            // Don't go flipping them in alphabetical order REPIII.
            let el = document.createElement("div");
            el.className = "marker-airport";
            $(el).css("background-color", color);
            $(el).attr("data-ident", ident);
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
            marker.addTo(this._map);
            this._markers[ident] = marker;
            this._popups.push(popup);

    }

    /*
     *  Draw the source airport onto the map.
     *
     *  Parameters
     *  ----------
     *  source  : (Number - Integer) OPTIONAL parameter. If this is
     *            given, then this._airportSource is set to the given
     *            arugment source. If the caller wants to use the
     *            already in-place this._airportSource, pass null.
     *
     *  Returns
     *  -------
     *  false   : Provided source was not a number and
     *            this_.airportSource is null
     *  true    : Source airport was drawn onto the map.
     */ 
    this.airportSource_draw = (source) => {

        if (typeof(source) === "number") {
            this._airportSource = source;
        } else if (this._airportSource == null) {
            return false;
        }

        let color = "#FF0000";
        if (this.get_reverse()) {
            color = "#0000FF";
        }
        this._airport_draw(this._airportSource, color);

        return true;

    }

    // Gets the airport IDs currently associated with the map, an
    // array of integers or an array of strings representing
    // integers.
    this.get_airports = () => { return this._airports; }
    // Gets the ID of the source airport currently associated with
    // the map.
    this.get_airportSource = () => { return this._airportSource; }
    // Gets the MapBox map object.
    this.get_map = () => { return this._map; }
    this.get_reverse = () => { return this._reverse; }

    this.redraw = (ident) => {

        if (typeof(ident) !== "number") {
            ident = this.get_airportSource();
            if (
                ident == null || !Array.isArray(this.get_airports())
            ) {
                return false;
            }
        }

        this.clear();
        this.set_airports($426Airports.get_dests(ident));
        this.airportSource_draw(ident);
        this.airports_draw(this.get_airports());
        this.draw_paths();

        return true;

    }

    this.reset = () => {

        this.clear();
        this._map.flyTo({
            center: [-99.9995795, 48.3552767],
            zoom: 4,
        });
        // Get and draw random airports.
    }

    this.select_path = (e, idDest, idSrc) => {

        if (this._paths == null) {
            return -1;
        }

        $426Controls.clear_autocomplete();

        let color = "#FF0000";
        let ret = false;
        let width = 7;

        if (e != null) { 

            idDest = e.features[0].properties.idDest;
            idSrc = e.features[0].properties.idSrc;

        } else if (
            typeof(idDest) !== "number"
            || typeof(idSrc) !== "number"
        ) {
            color = $426Map.LINE_COLOR;
            width = $426Map.LINE_WIDTH;
        }

        if (this._paths != null) {

            let data = this._paths.source.data;
            for (let line of data.features) {

                if (
                    idDest === line.properties.idDest
                    && idSrc === line.properties.idSrc
                ) {
                    line.properties.color = color;
                    line.properties.width = width;
                } else {
                    line.properties.color = $426Map.LINE_COLOR;
                    line.properties.width = $426Map.LINE_WIDTH;
                }
            }

            this._map.getSource("paths").setData(data);
            console.log(idDest);
            console.log(idSrc);
            $426Controls.set_input_dest(idDest);
            $426Controls.set_input_src(idSrc);

            ret = true;

        }

        // TODO Send info to Tickets interface.

        return ret;

    }

    /*
     *  Sets this._airports to an array of integers
     *
     *  These integers can be represented by Numbers or Strings.
     *
     *  Parameters
     *  ----------
     *  airports: (Array of Numbers - Integers OR Array of String
     *            with only digit characters) An array of airport
     *            IDs.
     *
     *  Returns
     *  -------
     *  -1  : airports is not an array.
     *  -2  : airports is a nonempty array of items that do not
     *        represent integers.
     *
     *  Notes
     *  -----
     *  This method has not been tested since it was last updated.
     */
    this.set_airports = (airports) => {

        if (!Array.isArray(airports)) {
            return -1;
        } else if (
            airports !== []
            && typeof(airports[0]) !== "number"
            && (typeof(airports[0]) === "string"
            && airports[0].search(/^\d+$/) < 0)
        ) {
            return -2;
        }

        this._airports = airports;

        return true;

    }

    /*
     *  Sets the airport source to an airport ID.
     *
     *  Parameters
     *  ----------
     *  source  : (Number - Integer) Airport ID to set the airport
     *            source to.
     *
     *  Returns
     *  -------
     *  false   : source is not a number.
     *  true    : this._airportSource was set to source.
     */
    this.set_airportSource = (source) => {

        if (typeof(source) === "number") {
            this._airportSource = source;
            return true;
        } else {
            return false;
        }

    }

    this.set_reverse = (bool) => {
        if (typeof(bool) !== "boolean") {
            return false;
        } else {
            this._reverse = bool;
            return true;
        }

    }

}

// Local helper function. You probably don't want to be calling this.
let map_pointer = function(e) {
    $("canvas.mapboxgl-canvas").toggleClass("pointer");
}

// Only load the map if testing the map directly.
// There is an API limit.

$(document).ready(() => {

    $426Map._map = new mapboxgl.Map({
        container: "map",
        style: "mapbox://styles/mapbox/light-v9",
        center: [-99.9995795, 48.3552767],
        zoom: 4,
    });

    $426Map.get_map().on("click", "paths", $426Map.select_path);
    $426Map.get_map().on("mouseenter", "paths", map_pointer);
    $426Map.get_map().on("mouseleave", "paths", map_pointer);
    $426Map.get_map().on(
        "click", function() {
            $426Controls.clear_autocomplete();
            $426Controls.reset_input();
    });
    $426Map.get_map().on(
        "drag", function() {
            $426Controls.clear_autocomplete();
            $426Controls.reset_input();
    });

    $("div#map").on("click", ".marker-airport", function(e) {

        let dest = undefined;
        let src = undefined;
        if ($426Map.get_reverse()) {
            dest = $426Map.get_airportSource();
            src = +$(e.target).attr("data-ident");
        } else {
            dest = +$(e.target).attr("data-ident");
            src = $426Map.get_airportSource(); 
        }
        // Clicking a marker will often click a path.
        // This will make it so the marker takes precedence.
        setTimeout(
            $426Map.select_path(null, dest, src),
            50
        );
       
    });

});

