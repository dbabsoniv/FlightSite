// FLIGHTS.JS //
$426FlightsPanel = new function() {

    this.clear = () => {}

    this.fill_objs = (flight) => {

        if (typeof(flight) === "number" && flight === -1) {

            console.log(
                "PANIC: $426Flight.retrieve_flights() "
                + "asynchronous request failed."
            );
            return;

        } else if (!(flight instanceof $426Flight)) {

            console.log("PANIC $426FlightsPanel Error");
            console.log(flight); 
            return flight;

        } else {

            $.when(
                $426Airline.retrieve_by_id(
                    flight.get_airline_id()
                ),
                $426Plane.retrieve_by_id(
                    flight.get_plane_id()
                )
            ).then(

                (ra, rp) => {

                    if (ra[2].status === 200 && rp[2].status === 200) {

                        $426FlightsPanel.fill_text(
                            new $426Airline(ra[0]),
                            flight,
                            new $426Plane(rp[0])
                        );

                    } else {

                        $426_ajax_handle_error(
                            ra[2], ra[1], ra[0],
                            "$426FlightsPanel.fill_objs Success: "
                            + "Failed to retrieve flight's "
                            + "airline information."
                        ); 
                        $426_ajax_handle_error(
                            rp[2], rp[1], rp[0],
                            "$426FlightsPanel.fill_objs Success: "
                            + "Failed to retrieve flight's "
                            + "plane information."
                        );

                    }

                },
                (jqXHR, text, err) => {

                    $426_ajax_handle_error(
                        jqXHR, text, err,
                        "$426FlightsPanel.fill_objs Error: "
                        + "Failed to retrieve flight's "
                        + "airline or plane information."
                    );

                },

            )

            return;

        }

    }

    this.fill_text = (airline, flight, plane) => {

        


    }

    this.fill_with = (idDest, idSrc) => {

        if (typeof(idDest) === "number" && typeof(idSrc) === "number") {

            let r = $426Flight.retrieve_flights(
                idDest, idSrc, $426FlightsPanel.fill_objs
            );
            // TODO False is an expectable output and needs to be
            // handled.
            if (r !== true) {
                console.log(
                    "PANIC: $426FlightsPanel.fill_with() "
                    + "failed to get flights with "
                    + "$426Flight.retrieve_flights()."
                );
                console.log(r);
            }

            return r;

        } else {

            return false;

        }

    }

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


    // TODO Remove Me.
    setTimeout(function() {
        $426FlightsPanel.fill_with(1806, 1611);
    }, 5000);

});
