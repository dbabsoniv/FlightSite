$426Controls = new function() {

    this._dest = null;
    this._source = null;

    this.clear_autocomplete = () => {
        $("div#controls-autocomplete-container").html("&nbsp;");
    }

    this.clear_input = (e) => {

        if ($(e.delegateTarget).attr("id") === "controls-dest-container") {
            $("input#controls-airport-dest").val("");
        }
        $("input#controls-airport-src").val("");
    }

    this.autofill = function(e) {

        //FIXME Destination should only fill with valid destinations.

        console.log(e);

        if ($426Airports == null) {
            setTimeout(100, controls_autofill(e));
        }

        const autocomplete = $("div#controls-autocomplete-container");
        const text = $(e.currentTarget).val();
        if (text === "") {
            autocomplete.html("&nbsp;");
            return;
        }

        const div = $(e.delegateTarget);
        let out = "";
        let source;
        console.log(`ID: ${div.attr("id")}`);
        if (div.attr("id") === "controls-src-container") {

            if (this._source != null) {
                $426Map.reset();
                this._source == null;
                $(e.currentTarget).val();
            }
            source = "src";

        } else {
            source = "dest";
        }

        for (const ident of $426Airports.autocomplete(text)) {

            out = (`${out}<div class="autocomplete" `
                + `data-code="${ident}" `
                + `data-source="${source}"><p>`
                + `${$426Airports.get_city(ident)} `
                + `(${$426Airports.get_code(ident)})</p></div>`
            );

        }

        autocomplete.html(out);
        autocomplete.css("width", div.css("width"));
        autocomplete.css("left", div.offset().left);

    }

}

$(document).ready(() => {

    $("div#controls-src-container").on(
        "input", "input#controls-airport-src", $426Controls.autofill
    );
    $("div#controls-dest-container").on(
        "input", "input#controls-airport-dest", $426Controls.autofill
    );

    $("div#controls-src-container").on(
        "click", "input#controls-airport-src", $426Controls.clear_input
    );
    $("div#controls-dest-container").on(
        "input", "input#controls-airport-dest", $426Controls.clear_input
    );


    $("div#controls-autocomplete-container").on(
        "click", "div.autocomplete", function(e) {

        let ident = $(this).attr("data-code");
        let text = $(this).children().first().text();

        console.log(ident);
        console.log(text);
        
        if ($(this).attr("data-source") === "src") {
            $("input#controls-airport-src").val(
                $(this).children().first().text()
            );
        } else {
            $("input#controls-airport-dest").val(
                $(this).children().first().text()
            );
        }

        $426Map.clear();
        $426Controls.clear_autocomplete();

        $426Map.set_airports($426Airports.get_dests(ident));
        $426Map.draw_airportSource(+ident);
        $426Map.draw_airports($426Map.get_airports());
        $426Map.draw_paths();
 
    });



});
