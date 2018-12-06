$426Controls = new function() {

    //FIXME Autcomplete needs to disspear on click of input box.
    //FIXME Autocomplete needs to dissapear on map click.
    //FIXME Have clicking airport select route.

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

        let dsts = undefined;
        if (this._src != null) {
            dsts = $426Airports.get_dests(this._src);
        }
        const div = $(e.delegateTarget);
        let out = "";
        let source;
        if (div.attr("id") === "controls-src-container") {
            $("input#controls-airport-dest").val("");
            source = "src";
        } else if (this._src == null) {
            $("input#controls-airport-dest").val("");
            return false;
        } else {
            source = "dest";
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

    this.clear_autocomplete = () => {
        $("div#controls-autocomplete-container").html("&nbsp;");
    }

    this.clear_input = (e) => {

        if ($(e.delegateTarget).attr("id") === "controls-src-container") {
            this._src = null;
            $("input#controls-airport-src").val("");
            //$426Map.reset();
        }

        $426Map.path_select(null, null, null);
        $("input#controls-airport-dest").val("");
    }

    this.get_src = () => { return this._src; }

    this.set_input_dest = (ident) => {

        if (typeof(ident) !== "number") {
            return false;
        }

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

        this._source = ident;
        $("input#controls-airport-src").val(
           `${$426Airports.get_city(ident)} `
            + `(${$426Airports.get_code(ident)})`
        );

        return true;

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

    $("div#controls-src-container").on(
        "click", "input#controls-airport-src",
        $426Controls.clear_input
    );

    $("div#controls-dest-container").on(
        "click", "input#controls-airport-dest",
        $426Controls.clear_input
    );

    $("div#controls-autocomplete-container").on(
        "click", "div.autocomplete", function(e) {

        let ident = $(this).attr("data-code");
        let text = $(this).children().first().text();

        if ($(this).attr("data-source") === "src") {
            $("input#controls-airport-src").val(
                $(this).children().first().text()
            );
            $426Controls.set_src(+ident);
            $426Map.clear();
            $426Map.set_airports($426Airports.get_dests(ident));
            $426Map.airportSource_draw(+ident);
            $426Map.airports_draw($426Map.get_airports());
            $426Map.paths_draw();

        } else {
            $("input#controls-airport-dest").val(
                $(this).children().first().text()
            );
            if ($426Controls.get_src() != null) {
                $426Map.path_select(
                    null, +ident, $426Controls.get_src()
                );
            }
        }

        $426Controls.clear_autocomplete();

    });

});
