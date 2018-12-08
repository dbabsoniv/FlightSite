$426Controls = new function() {

    //FIXME Have clicking airport select route.

    this._dest = null;
    this._src = null;

    this.autocomplete = (e) => {

        if ($426Airports == null) {
            setTimeout(500, $426Controls.autocomplete(e));
            return;
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

        for (const ident of $426Airports.autocomplete(text)) {

            if (dsts != null) {

                for (const idDst of dsts) {

                    if (idDst === ident) {

                        out = (`${out}<div class="autocomplete" `
                            + `data-code="${ident}" `
                            + `data-source="${source}"><p>`
                            + `${$426Airports.get_city(ident)} `
                            + `(${$426Airports.get_code(ident)})</p></div>`
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

    this.autocomplete_handle = (e) => {

        let ident = +$(e.currentTarget).attr("data-code");
        let reset = false;
        let text = $(e.currentTarget).children().first().text();
        let source = $(e.currentTarget).attr("data-source");

        if (source === "src") {

            this.set_input_src(ident);
            this.set_src(ident);
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
            $426Map.redraw(ident);
            if (source === "src") {
                this.clear_input_dest();
            } else {
                this.clear_input_src();
            }
        } else {

            $426Map.path_select(
                null, this.get_dest(), this.get_src()
            );

        }

        this.clear_autocomplete();

    }

    this.clear_autocomplete = () => {
        if (this.get_dest() == null) {
            this.clear_input_dest();
        }
        if (this.get_src() == null) {
            this.clear_input_src();
        } 
        $("div#controls-autocomplete-container").html("&nbsp;");
    }

    this.clear_input_dest = () => {
        if (this._dest != null && this._dest > 0) {
            $426Map.path_select(null, null, null);
            $("input#controls-airport-dest").val("");
            if ($426Map.get_reverse()) {
                $426Map.set_reverse(false);
            }
        }
        this._dest = -this._dest;
    }

    this.clear_input_src = () => {
        if (this._src != null && this._src > 0) {
            $426Map.path_select(null, null, null);
            $("input#controls-airport-src").val("");
        }  
        this._src = -this.src;
    }

    this.input_reset = () => {
    
        if (this.get_dest() != null) {
            if (this._dest < 0) {
                this._dest = -this._dest;
            }
            this.set_input_dest(this.get_dest());
        }
        if (this.get_src() != null) {
            if (this._src < 0) {
                this._src = -this._src;
            }
            this.set_input_src(this.get_src());
        }

    }

    this.get_dest = () => {
        if (this._dest != null && this._dest > 0) {
            return this._dest;
        } else {
            return null;
        }
    } 
    this.get_src = () => {

        if (this._src != null && this._src > 0) {
            return this._src;
        } else {
            return null;
        }

    }

    this.set_input_dest = (ident) => {

        if (typeof(ident) !== "number") {
            return false;
        }

        this._dest = ident;
        $("input#controls-airport-dest").val(
            `${$426Airports.get_city(ident)} `
            + `(${$426Airports.get_code(ident)})`
        );

        return true;

    }
    this.set_input_src = (ident) => {

        if (typeof(ident) !== "number") {
            return false;
        }

        this._src = ident;
        $("input#controls-airport-src").val(
           `${$426Airports.get_city(ident)} `
            + `(${$426Airports.get_code(ident)})`
        );

        return true;

    }

    this.set_dest = (ident) => {
        if (typeof(ident) === "number") {
            this._dest = ident;
            return true;
        } else {
            return false;
        }
    }


    this.set_src = (ident) => {
        if (typeof(ident) === "number") {
            this._src = ident;
            return true;
        } else {
            return false;
        }
    }

}

$(document).ready(() => {

    $("div#controls-src-container").on(
        "input", "input#controls-airport-src",
        $426Controls.autocomplete
    );
    $("div#controls-dest-container").on(
        "input", "input#controls-airport-dest",
        $426Controls.autocomplete
    );

    $("div#controls-dest-container").on(
        "click", "input#controls-airport-dest",
        function(e) {
            $426Controls.clear_autocomplete(e);
            $426Controls.clear_input_dest(e);
        }
    );

    $("div#controls-src-container").on(
        "click", "input#controls-airport-src",
        function(e) {
            $426Controls.clear_autocomplete(e);
            $426Controls.clear_input_src(e);
        }
    );

    $("div#controls-autocomplete-container").on(
        "click", "div.autocomplete", $426Controls.autocomplete_handle
    );

});
