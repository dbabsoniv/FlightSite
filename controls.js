// CONTROLS.JS //
var $426Controls = new function() {

    //FIXME REPIII doesn't like the behavior of the autocomplete
    //FIXME before the first AJAX call returns. I'm not entirely sure
    //FIXME what our behavior should be though.

    this._firstAJAXTimeout = null;
    // These can be positive or negative. It's incredibly hacky but
    // it works. See their getters for more info.
    // Point is NEVER refer to these resources directly. NEVER.
    // ALWAYS call the getter.
    this._dest = null;
    this._src = null;

    // Fills in the autcomplete interface as a user types into the
    // input boxes.
    // You probably don't want to be calling this.
    this.autocomplete = (e) => {

        // The input boxes are active and ready before the first AJAX
        // call is done. This waits for the AJAX call to be done
        // before autocomplete attempts to autocomplete.
        if ($426Airports == null) {

            if (this._firstAJAXTimeout != null) {
                clearTimeout(this._firstAJAXTimeout);
            }

            this._firstAJAXTimeout = setTimeout(
                function(e)  {
                    $426Controls._firstAJAXTimeout = null;
                    $426Controls.autocomplete(e);
                }, 50
            );

            return;

        } else if (this._firstAJAXTimeout != null) {
            clearTimeout(this._firstAJAXTimeout);
            this._firstAJAXTimeout = null;
        }

        // Don't move autoclompete REPIII. It's needed right there.
        const autocomplete = $("div#controls-autocomplete-container");
        const text = $426_sanitize($(e.currentTarget).val());
        if (text === "") {
            autocomplete.html("&nbsp;");
            return;
        }
        let dsts = null;
        const div = $(e.delegateTarget);
        let out = "";
        let source = undefined;
        if (div.attr("id") === "controls-src-container") {
            source = "src";
        } else if (div.attr("id") === "controls-dest-container") {
            source = "dest";
        } else {
            return false;
        }

        if (
            source === "src"
            && this.get_dest() != null
            && $426Map.get_reverse()
        ) {
            dsts = $426Airports.get_dests(this.get_dest()); 
        } else if (
            source === "dest"
            && this.get_src() != null
            && !$426Map.get_reverse()
        ) {
            dsts = $426Airports.get_dests(this.get_src());
        }

        if (source === "src" && !$426Map.get_reverse()) {
            this.clear_input_dest();
        } else if (source === "dest" && $426Map.get_reverse()) {
            this.clear_input_src();
        }

        for (const ident of $426Airports.autocomplete(text)) {

            if (dsts != null) {

                for (const idDst of dsts) {

                    if (idDst === ident) {

                        out = (`${out}<div class="autocomplete" `
                            + `data-code="${ident}" `
                            + `data-source="${source}"><p>`
                            + `${$426Airports.get_city(ident)} `
                            + `(${$426Airports.get_code(ident)})`
                            + `</p></div>`
                        );
                        break;
                    }

                }

            } else {

                out = (`${out}<div class="autocomplete" `
                    + `data-code="${ident}" `
                    + `data-source="${source}"><p>`
                    + `${$426Airports.get_city(ident)} `
                    + `(${$426Airports.get_code(ident)})</p></div>`
                );

            }

        }

        autocomplete.html(out);
        autocomplete.css("width", div.css("width"));
        autocomplete.css("left", div.offset().left);

    }

    // Handles a click in the autocomplete interface.
    // You probably don't want to be calling this.
    this.autocomplete_handle = (e) => {

        // Autcomplete often will fail on strings less than 4
        // characters when on a limited set (like only
        // destinations). This should not considered a bug.

        let ident = +$(e.currentTarget).attr("data-code");
        let reset = false;
        let text = $(e.currentTarget).children().first().text();
        let source = $(e.currentTarget).attr("data-source");

        if (source === "src") {

            this.set_input_src(ident);
            this.set_src(ident);
            if (this.get_dest() == null) {
                $426Map.set_reverse(false);
            }
            if (!$426Map.get_reverse()) {
                reset = true;
            }

        } else {

            this.set_input_dest(ident);
            this.set_dest(ident);
            if (this.get_src() == null) {
                $426Map.set_reverse(true);
            }
            if ($426Map.get_reverse()) {
                reset = true;
            }

        }

        if (
            this.get_dest() == null
            || this.get_src() == null
            || reset
        ) {

            $426Map.set_new(false);

            // Yes you must set them to null here.
            // Don't change it unless you redo the entire
            // input replacement scheme.
            // This prevents stale input.
            if (source === "src") {
                //if (this.get_dest() != null) {
                this._dest = null;
                //}
                this.clear_input_dest();
            } else {
                //if (this.get_src() != null) {
                this._src = null;
                //}
                this.clear_input_src();
            }

            $426Map.redraw(ident);

        } else {

            $426Map.select_path(
                null, this.get_dest(), this.get_src()
            );

        }

        this.clear_autocomplete();

    }

    // Removes the autocomplete interface from the window and clears
    // input boxes if appropriate.
    this.clear_autocomplete = () => {
        if (this.get_dest() == null) {
            this.clear_input_dest();
        }
        if (this.get_src() == null) {
            this.clear_input_src();
        }
        $("div#controls-autocomplete-container").html("&nbsp;");

    }

    // Clears the destination input box.
    this.clear_input_dest = () => {
        if (this._dest == null || this._dest > 0) {
            $426Map.select_path(null, null, null);
            $("input#controls-airport-dest").val("");
            if ($426Map.get_reverse()) {
                // Order matters. Don't reverse them.
                this.clear_input_src();
                //$426Map.set_reverse(false);
            }
        }
        // Allows for resetting input box to old value on map
        // movement if appropriate.
        if (this.get_dest() != null) {
            this._dest = -this._dest;
        }
    }

    // Clears the source input box.
    this.clear_input_src = () => {
        if (this._src == null || this._src > 0) {
            $426Map.select_path(null, null, null);
            $("input#controls-airport-src").val("");
        }
        if (!$426Map.get_reverse()) {
            this.clear_input_dest();
        }
        // Allows for resetting input box to old value on map
        // movement if appropriate.
        if (this.get_src() != null) {
            this._src = -this._src;
        }
    }

    /*
     *  Gets the airport ID of the active destination airport.
     *
     *  Returns
     *  -------
     *  this._src   : (Number - Integer) Airport ID of the active
     *                airport in the destination input box, whether or
     *                not that's what's currently in the box or not.
     *
     *  Notes
     *  -----
     *  An airport ID can never be negative, but to support some
     *  behavior this._dest can be. If that's the case, this getter
     *  pretends this._dest is null and returns null.
     */
    this.get_dest = () => {
        if (this._dest != null && this._dest > 0) {
            return this._dest;
        } else {
            return null;
        }
    }

    /*
     *  Gets the airport ID of the active source airport.
     *
     *  Returns
     *  -------
     *  this._src   : (Number - Integer) Airport ID of the active
     *                airport in the source input box, whether or
     *                not that's what's currently in the box or not.
     *
     *  Notes
     *  -----
     *  An airport ID can never be negative, but to support some
     *  behavior this._src can be. If that's the case, this getter
     *  pretends this._src is null and returns null.
     */
    this.get_src = () => {

        if (this._src != null && this._src > 0) {
            return this._src;
        } else {
            return null;
        }

    }

    this.hide = () => {
        $("div#controls").addClass("hidden");
    }

    // Resets input in both destination and source input boxes to
    // what this._dest and this._airport indicate the
    // input last was. No manipulations are made to the map.
    this.reset_input = () => {

        if (this._dest != null) {
            if (this._dest < 0) {
                this._dest = -this._dest;
            }
            this.set_input_dest(this.get_dest());
        }
        if (this._src != null) {
            if (this._src < 0) {
                this._src = -this._src;
            }
            this.set_input_src(this.get_src());
        }

    }

    /*
     *  Updates this._dest to the airport ID of the currently active
     *  destination airport.
     *
     *  Parameters
     *  ----------
     *  ident   : (Number - Integer) Airport ID of the currently
     *            active source airport.
     *
     *  Returns
     *  -------
     *  false   : ident is not a number
     *  true    : ident is a number and this._dest was set.
     */
    this.set_dest = (ident) => {
        if (typeof(ident) === "number") {
            this._dest = ident;
            return true;
        } else {
            return false;
        }
    }

    /*
     *  Sets the destination input box to the text appropriate for a
     *  given airport ID.
     *
     *  Parameters
     *  ----------
     *  ident   : (Number - Integer) Airport ID of the destination
     *            airport.
     *
     *  Returns
     *  -------
     *  -1      : ident was not a number.
     *  -2      : ident was not a valid Airport ID.
     *  true    : Destination input box text was set.
     *
     */
    this.set_input_dest = (ident) => {

        if (typeof(ident) !== "number") {
            return false;
        } else if (!$426Airports.is_airport_id(ident)) {
            return -2;
        }

        this._dest = ident;
        $("input#controls-airport-dest").val(
            `${$426Airports.get_city(ident)} `
            + `(${$426Airports.get_code(ident)})`
        );

        return true;

    }

    /*
     *  Sets the source input box to the text appropriate for a
     *  given airport ID.
     *
     *  Parameters
     *  ----------
     *  ident   : (Number - Integer) Airport ID of the source
     *            airport.
     *
     *  Returns
     *  -------
     *  -1      : ident was not a number.
     *  -2      : ident was not a valid Airport ID.
     *  true    : Source input box text was set.
     *
     */

    this.set_input_src = (ident) => {

        if (typeof(ident) !== "number") {
            return -1;
        } else if (!$426Airports.is_airport_id(ident)) {
            return -2;
        }

        this.set_src(ident);
        $("input#controls-airport-src").val(
           `${$426Airports.get_city(ident)} `
            + `(${$426Airports.get_code(ident)})`
        );

        return true;

    }

    /*
     *  Updates this._src to the airport ID of the currently active
     *  source airport.
     *
     *  Parameters
     *  ----------
     *  ident   : (Number - Integer) Airport ID of the currently
     *            active source airport.
     *
     *  Returns
     *  -------
     *  false   : ident is not a number
     *  true    : ident is a number and this._src was set.
     */

    this.set_src = (ident) => {
        if (typeof(ident) === "number") {
            this._src = ident;
            return true;
        } else {
            return false;
        }
    }

    this.show = () => {
        $("div#controls").removeClass("hidden");
    }

}

$(document).ready(() => {

    $("div#controls-src-container").on(
        "input", "input#controls-airport-src", function(e) {
            $426Controls.autocomplete(e);
            $426FlightsPanel.hide();
            $426FlightsPanel.clear();
        }
    );
    $("div#controls-dest-container").on(
        "input", "input#controls-airport-dest", function(e) {
            $426Controls.autocomplete(e);
            $426FlightsPanel.hide();
            $426FlightsPanel.clear();
        }
    );

    $("div#controls-dest-container").on(
        "click", "input#controls-airport-dest",
        function(e) {
            $426FlightsPanel.hide();
            $426FlightsPanel.clear();
            $426Controls.clear_autocomplete(e);
            $426Controls.clear_input_dest(e);
        }
    );

    $("div#controls-src-container").on(
        "click", "input#controls-airport-src",
        function(e) {
            $426FlightsPanel.hide();
            $426FlightsPanel.clear();
            $426Controls.clear_autocomplete(e);
            $426Controls.clear_input_src(e);
        }
    );

    $("div#controls-autocomplete-container").on(
        "click", "div.autocomplete", $426Controls.autocomplete_handle
    );

});
