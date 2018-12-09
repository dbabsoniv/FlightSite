// itineraries.JS //
$426itinerariesPanel = new function() {



}

$(document).ready(() => {

    $("div#itineraries").addClass("itineraries-showww");

    let button_timeout = null;

    $("div#controls-itineraries-button").mouseenter(function() {
        button_timeout = setTimeout(function() {
                $("div#itineraries").addClass("itineraries-show")
            },
            400
        );
    });
    $("div#controls-itineraries-button").mouseleave(function() {
        if (button_timeout != null) {
            clearTimeout(button_timeout);
            button_timeout = null;  
        }
    });
    $("div#itineraries").on("transitionend", function() {
        $("div#itineraries").removeClass("itineraries-show");
    });
 
});
