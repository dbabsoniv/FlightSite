$426ItineraryPanel = new function() {
}

$(document).ready(() => {


    $("div#controls-itinerary-button").mouseenter(() => {
        $("div#itinerary").addClass("itinerary-show");
    });
    $("div#itinerary").on("transitionend", () => {
        $("div#itinerary").removeClass("itinerary-show");
    });
 
});
