let controls_autofill = function(e) {

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

    for (const ident of $426Airports.autocomplete(text)) {

        out = (`${out}<div class="autocomplete"`
            + `data-code="${ident}"><p>`
            + `${$426Airports.get_city(ident)} `
            + `(${$426Airports.get_code(ident)})</p></div>`
        );

    }

    autocomplete.html(out);
    autocomplete.css("width", div.css("width"));
    autocomplete.css("left", div.offset().left);
    
}

$(document).ready(() => {

    $("div#controls-src-container").on(
        "input", "input#controls-airport-src", controls_autofill
    );
    $("div#controls-dest-container").on(
        "input", "input#controls-airport-dest", controls_autofill
    );
    //$("div#controls-autofill-container").on(
    //    "click", "div.autofill", controls_set_airport
    //);


});
