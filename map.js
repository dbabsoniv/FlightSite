// MAP.JS //
$426Map = new function() {

    // There are no plans of making getters and setters for markers
    // and popups. They should never be publicly referenced.

    this.LINE_COLOR = "#17A589";
    this.LINE_WIDTH = 5;

    this._airports = [];
    this._airportSource = null;
    this._map = undefined;
    this._markers = {};
    this._new = true;
    this._paths = null;
    // FIXME Is pathActive ever used? I don't think I was able to use
    // FIXME it when coloring the active line was I?
    this._pathActive = null;
    this._popups = [];
    this._reverse = false;

    // Clears the map of all lines, markers, and popups.
    // This does not reset the map to its starting state.
    // $426Map.reset() does that.
    this.clear = () => {

        if (this.get_paths() != null) {
            this._map.removeLayer("paths");
            this._paths = null;
        }
        for (const popup of this._popups) {
            popup.remove();
        }
        Object.keys(this._markers).forEach((key) => {
            this._markers[key].remove();
        });
        this._airportSource = null;
        this._pathActive = null;
        this._popups = [];
        this._markers = {};
    }

    /*
     *  Draws airport markers and associated popups on the map.
     *
     *  This method doesn't clear anything. It is up to the caller to
     *  clear the map before calling this function, if that is the
     *  callers intention.
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
     *        represented by numbers or strings.
     *  true: airports were drawn onto the map.
     *
     *  Notes
     *  -----
     *  This method does not ensure that the airports drawn onto the
     *  map are in the map's window. The map is not moved as the
     *  airports are drawn.
     */
    this.draw_airports = (airports) => {

        // These checks are needed for the map load array. 
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
           this._draw_airports(ident, color);
        }

        return true;

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
     *  -1      : source was not a number and this._airportSource
     *            is null.
     *  -2      : source is not a valid airport ID. 
     *  true    : Source airport was drawn onto the map.
     */ 
    this.draw_airportSource = (ident) => {

        if (typeof(ident) === "number") {

            if (!$this.set_airportSource(ident)) {

                return -2;

            } 
        
        } else if (this.get_airportSource() == null) {

            return -1;

        }

        let color = "#FF0000";
        if (this.get_reverse()) {
            color = "#0000FF";
        }
        this._draw_airports(this.get_airportSource(), color);

        return true;

    }

    // Helper function. Don't call this.
    // Call this.draw_airports() or this.draw_airportSource() instead.
    //
    // Don't put complicated checks in this function. It's a helper.
    // Put the checks in its parents.
    this._draw_airports  = (ident, color) => {

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
            // TODO Write better airport text.
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
     *  Draws paths from this._airportSource to all airports in
     *  this._airports.
     * 
     *  Returns
     *  -------
     *  -1  : this._airportSource is null
     *  -2  : this._airports is not an array.
     *  true: Paths were draw on the map    
     */
    this.draw_paths = () => {

        if (this.get_airportSource() == null) {
            return -1;
        } else if (!Array.isArray(this.get_airports())) {
            return -2;
        }

        this._paths = null;

        let arcs = {};
        const ARC_TICKS = 125;
        // [[LONG_MIN, LAT_MIN], [LONG_MAX, LAT_MAX]]
        let aslo = $426Airports.get_long(this.get_airportSource());
        let asla = $426Airports.get_lat(this.get_airportSource());
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

        for (const ident of this.get_airports()) {

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
     *  Gets the airport IDs currently associated with the map.
     *  These IDs do NOT include this._airportSource. 
     *
     *  Returns
     *  -------
     *  airports: (Array of Integers or Strings Representing
     *            Integers) The array of airport IDs currently
     *            associated with the map. 
     */
    this.get_airports = () => { return this._airports; }
    // Gets the ID of the source airport currently associated with
    // the map.
    this.get_airportSource = () => { return this._airportSource; }
    // Gets the MapBox map object.
    this.get_map = () => { return this._map; }
    // Gets the boolean indicating whether or not the map is in a new
    // state.
    this.get_new = () => { return this._new; }
    // Gets paths. Paths can be null.
    this.get_paths = () => { return this._paths; }
    // Gets the boolean determining whether the this._airportSource
    // is a destination (true) or a source (false).
    this.get_reverse = () => { return this._reverse; }

    /* FIXME
     * As of commit 10a2ade58199de31e1288981fd4cd6267362659b
     * this is currently only used by one line in Controls.js,
     * and really it's quite a dangerous method. It should probably be
     * removed from here and put back into Controls.js. It originated
     * there.
     FIXME */
    /*
     *  Redraws the map. This function can set a new airport source,
     *  if provided.
     *
     *  Parameters
     *  ----------
     *  ident   : (Number - Integer) ID of the source airport of the
     *            new map. Can be null if you do not wish to reset
     *            the source airport to a new airport.
     *
     *  Returns
     *  -------
     *  -1      : ident was not a number and this._airportSource is
     *            null.
     *  -2      : this._airports is not an array.
     *  -3      : ident was not a valid airport ID.
     *  true    : Map was successfully redrawn.
     *
     */
    this.redraw = (ident) => {

        if (typeof(ident) === "number") {

           if (!$426Airports.is_airport_id(ident)) {

                return -3;

            }

        } else {

            ident = this.get_airportSource();

        }

        // This is meant to be a new logic block.
        if (ident == null) {
            return -1;
        } else if (!Array.isArray(this.get_airports())) {
            return -2;
        }

        this.clear();
        // Yes you must set the airport source to ident.
        // this.clear() clears it.
        this.set_airportSource(ident); 
        this.set_airports($426Airports.get_dests(
            this.get_airportSource())
        );
        this.draw_airportSource();
        this.draw_airports(this.get_airports());
        this.draw_paths();

        return true;

    }

    // Resets the map to it's initial state. Randomly chosen airports
    // are random.
    this.reset = () => {

        this.set_new(true);
        this.clear();
        this.getMap().flyTo({
            center: [-99.9995795, 48.3552767],
            zoom: 4,
        });
        // TODO Get and draw random airports.
    }

    // Selects an airport marker and updates paths accordingly.
    // You probably don't want to call this.
    this.select_airport = (e) => {

        let dest = undefined;
        let src = undefined;
        if ($426Map.get_reverse()) {
            dest = $426Map.get_airportSource();
            src = +$(e.target).attr("data-ident");
        } else {
            dest = +$(e.target).attr("data-ident");
            src = $426Map.get_airportSource(); 
        }

        if (dest === src) {
            return;
        }

        // Clicking a marker will often click a path.
        // This will make it so the marker takes precedence.
        // REPIII is unsure if this matters.
        setTimeout(() => {
                $426Map.select_path(null, dest, src);
            }, 10
        );
 
    }

    /*
     *  Selects a path on the map, opens the Tickets panel, and sets
     *  the input boxes to the airports implied by the path selected. 
     *
     *  This is what makes lines red.
     *
     *  this._paths cannot be null when this method is called.
     *
     *  All parameters are optional. Functionality differs depending
     *  on what functions are provided.
     *
     *  Parameters
     *  ----------
     *  e       : (Event Object) Event object associated with
     *            clicking a path. This MUST be null otherwise.
     *  idDest  : (Number - Integer) ID of the destination airport.
     *            Can be null.
     *  idSrc   : (Number - Integer) Id of the source airport. Can be
     *            null.
     *
     *  Returns
     *  -------
     *  -1      : this._paths is null
     *  false   : idDest or idSrc was undefined. Ticket panel was not
     *            opened.
     *  true    : idDest and idSrc were defined in some manner, maybe
     *            via e. Ticket panel has been opened.
     *
     *  Notes
     *  -----
     *  If you wish to deselect a path, recolouring it, call this
     *  function: $426Map.select_path(null, null, null).
     *
     *  idDest and idSrc are not tolerant arguments. They will not
     *  accept strings representing integers. You must do the casting
     *  before calling this method.
     *
     *  If e is provided, then idDest and idSrc are overridden. The
     *  values from e have precedence.
     */ 
    this.select_path = (e, idDest, idSrc) => {

        if (this.get_paths() == null) {
            return -1;
        }

        $426Controls.clear_autocomplete();

        let color = "#FF0000";
        let width = 7;

        if (e != null) { 

            idDest = e.features[0].properties.idDest;
            idSrc = e.features[0].properties.idSrc;
            ret = true;

        } else if (
            typeof(idDest) !== "number"
            || typeof(idSrc) !== "number"
        ) {
            color = $426Map.LINE_COLOR;
            width = $426Map.LINE_WIDTH;
        } 

        let data = this.get_paths().source.data;
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

        if (idDest == null || idSrc == null) {

            return false;

        } else {

            $426Controls.set_input_dest(idDest);
            $426Controls.set_input_src(idSrc);

            // TODO Send info to Tickets interface.
            console.log(idSrc);
            console.log(idDest);

            return true;

        }

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
     *  The checks do not extend to all array elements. The first is
     *  check and the rest are assumed to be similarly correct.
     *
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
            && $426Airport.is_airport_id(+airports[0])
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
     *  false   : source is not a valid airport ID
     *  true    : this._airportSource was set to source.
     */
    this.set_airportSource = (ident) => {

        if (
            typeof(ident) === "number"
            && $426Airports.is_airport_id(ident)
        ) {
            this._airportSource = ident;
            return true;
        } else {
            return false;
        }

    }

    /*
     *  Sets whether the map should exhibit a "new" state filled with
     *  temporary airports that when clicked fill source.
     * 
     *  Parameters
     *  ----------
     *  bool: (Boolean) Boolean determining whether nor not the map
     *        is now in a new state.
     *
     *  Returns
     *  -------
     *  false   : bool was not a boolean.
     *  true    : bool was a boolean.
     * 
     *  Notes
     *  -----
     *  This DOES NOT call $426Map.reset(), which you should do if
     *  you're setting this to true.
     */
    this.set_new = (bool) => {

        if (typeof(bool) !== "boolean") {
            return false;
        } else {
            this._new = bool;
            return true;
        }

    }

    // Sets the boolean determining whether airportSource is a
    // destination or a source. (How to color airports, etc.)
    this.set_reverse = (bool) => {

        if (typeof(bool) !== "boolean") {
            return false;
        } else {
            this._reverse = bool;
            return true;
        }

    }

}

// Local helper function for pointing at lines on the map.
// You probably don't want to be calling this.
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
        zoom: 3,
    });

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

    $("div#map").on(
        "click", ".marker-airport", $426Map.select_airport
    );

    $426Map.get_map().on("click", "paths", $426Map.select_path);
    $426Map.get_map().on("mouseenter", "paths", map_pointer);
    $426Map.get_map().on("mouseleave", "paths", map_pointer);

});

