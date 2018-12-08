// ITINERARY.JS //
$426ItineraryPanel = new function() {
}

$(document).ready(() => {

    let button_timeout = null;

    $("div#controls-itinerary-button").mouseenter(function() {
        button_timeout = setTimeout(function() {
                $("div#itinerary").addClass("itinerary-show")
            },
            400
        );
    });
    $("div#controls-itinerary-button").mouseleave(function() {
        if (button_timeout != null) {
            clearTimeout(button_timeout);
            button_timeout = null;  
        }
    });
    $("div#itinerary").on("transitionend", function() {
        $("div#itinerary").removeClass("itinerary-show");
    });
 
});
