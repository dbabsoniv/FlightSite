// FLIGHTS.JS //
$426FlightsPanel = new function() {

    this.clear = () => {
        $("div#flights").html("");
    }

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

        let codeDest = $426Airports.get_code(flight.get_arrival_id());
        let codeSrc = $426Airports.get_code(flight.get_departure_id());
        let price = parseFloat($426Ticket.make_price(flight)).toFixed(2);

        let out = (
            `<div class="flight">`
            + `<div class="flight-airline">`
            + `<p><img src="logos/${airline.get_logoURL()}">`
            + `${airline.get_name()}</p><p>`
            + `${flight.get_number()}</p>`
        );
        if (flight.get_operator_id() != null) {
            out = (
                `${out}<p class="flight-operator">`
                + `Operated by Endeavor Airlines</p>`
            );
        }
        out = (
            `${out}</div><div class="flight-details"><p>`
            + `${flight.get_departure_time_string()} - `
            + `${flight.get_arrival_time_string()}</p><p>` 
            + `${codeSrc} ⇒ ${codeDest}`
            + `</p><p>Distance: `
            + `${flight.get_distance_m().toLocaleString()} Miles`
            + `</p>`
            + `<p>${plane.get_name()}</p>`
            + `</div><div class="flight-purchase"><p>\$`
            + `${price}</p><div class="flight-button" `
            + `data-dest="${codeDest}" `
            + `data-flight="${flight.get_id()}" `
            + `data-number="${flight.get_number()}" `
            + `data-plane="${plane.get_id()}" `
            + `data-price="${price}" `
            + `data-src="${codeSrc}"</div>`
            + `<p>Select</p></div>`
            + `</div></div>`
        );

        $("div#flights").append(out);
        this.show();

        return true;

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

    $("div#flights").on("click", "div.flight-button", function(e) {

        let button = $(e.target).parent();
        $426TicketPanel.show_ticket(
            button.attr("data-dest"),
            button.attr("data-src"),
            +button.attr("data-flight"),
            button.attr("data-number"),
            +button.attr("data-plane"),
            +button.attr("data-price")
        );

    });


    // TODO Remove Me.
    //setTimeout(function() {
    //    $426FlightsPanel.fill_with(1662, 1611);
    //}, 7000);

});
