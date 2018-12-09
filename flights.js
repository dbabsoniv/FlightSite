// FLIGHTS.JS //
$426FlightsPanel = new function() {

    this.clear = () => {}
    this.fill = (idDest, idSrc) => {}
    this.hide = () => {
        $("div#flights").removeClass("flights-show");
    }
    this.show = () => {
        $("div#flights").addClass("flights-show");
    }

}

$(document).ready(() => {

    $("div#flights-button-temp").click(function(e) {
        $426FlightsPanel.hide();
        $426Controls.hide();
        $426TicketPanel.show();
    }); 

});
