// ITINERARIES.JS //
$426ItinerariesPanel = new function() {

    this.filling = false;

    this.fillPacket = function() {
        this.airline = null;
        this.dest = null;
        this.flight = null; 
        this.operator = null;
        this.source = null;
        this.ticket = null;
    }

    this.clear = () => {
        $("div#itineraries-container").html("");
    }

    this.fill = (r) => {

        if (typeof(r) === "number" && r === -1) {

            this.filling = false;
            console.log("PANIC: Asynchronous request failed.");
            return -1;

        } else if (r instanceof $426Itinerary) {

            return $426Ticket.retrieve_by_itinerary_id(r.get_id(), $426ItinerariesPanel.fill);

        } else if (r instanceof $426Ticket) {

            // FIXME NONE of these error handling $.when
            // subfunctions have been tested. I can't get them to
            // fail easily.
            let pack = new $426ItinerariesPanel.fillPacket();
            pack["ticket"] = r;
            $.when($426Instance.retrieve_by_id(
                pack["ticket"].get_idInstance())
            ).then(
                (insta, text, jqXHR) => {

                    if (jqXHR.status === 200) {
                        insta = new $426Instance(insta);
                        $.when($426Flight.retrieve_by_id(
                            insta.get_flight_id())
                        ).then(
                            (flight, text, jqXHR) => {

                                if (jqXHR.status === 200) {

                                    pack["flight"] = new $426Flight(flight);
                                    $426ItinerariesPanel.fill(pack);

                                } else {

                                    this.filling = false;
                                    $426_ajax_handle_error(
                                        jqXHR, text, flight,
                                        "$426ItinerariesPanel.fill "
                                        + "success: AJAX call for "
                                        + "$426Flight.retrieve_by_id "
                                        + "failed."
                                    );

                                }

                            },
                            (jqXHR, text, err) => {

                                this.filling = false;
                                $426_ajax_handle_error(
                                    jqXHR, text, err,
                                    "$426ItinerariesPanel.fill "
                                    + "error: AJAX call for "
                                    + "$426Flight.retrieve_by_id "
                                    + "failed."
                                );

                            });

                    } else {

                        this.filling = false;
                        $426_ajax_handle_error(
                            jqXHR, text, insta,
                            "$426ItinerariesPanel.fill "
                            + "success: AJAX call for "
                            + "$426Instance.retrieve_by_id "
                            + "failed."
                        );

                    }

                },
                (jqXHR, text, err) => {

                    this.filling = false;
                    $426_ajax_handle_error(
                        jqXHR, text, err,
                        "$426ItinerariesPanel.fill "
                        + "error: AJAX call for "
                        + "$426Instances.retrieve_by_id "
                        + "failed."
                    )

                }
            );

            return;

        } else if (r instanceof $426ItinerariesPanel.fillPacket) {

            if (r["airline"] == null) {

                if (r["flight"].get_operator_id() != null) {

                    $.when(
                        $426Airline.retrieve_by_id(
                            r["flight"].get_airline_id()
                        ),
                        $426Airline.retrieve_by_id(
                            r["flight"].get_operator_id()
                        ),
                    ).then( 
                        (airline, operator) => {

                            if (airline[2].status === 200 && operator[2].status === 200) {

                                r["airline"] = new $426Airline(airline[0]);
                                r["operator"] = new $426Airline(operator[0]);
                                $426ItinerariesPanel.fill(r);

                            } else {

                                this.filling = false;
                                $426_ajax_handle_error(
                                    airline[2], airline[1], airline[0],
                                    "$426ItinerariesPanel.fill() "
                                    + "panicked on getting the airline "
                                    + "and the operator." 
                                );
                                $426_ajax_handle_error(
                                    operator[2], operator[1], operator[0],
                                    "$426ItinerariesPanel.fill() "
                                    + "panicked on getting the airline "
                                    + "and the operator."
                                );

                            }

                        },
                        (jqXHR, text, err) => {

                            this.filling = false;
                            $426_ajax_handle_error(
                                jqXHR, text, err,
                                "$426ItinerariesPanel.fill() "
                                + "panicked on getting the airline "
                                + "and the operator."
                            );

                        });

                } else {

                    $.when(
                        $426Airline.retrieve_by_id(
                            r["flight"].get_airline_id()
                        ),
                    ).then( 
                        (airline, text, jqXHR) => {

                            if (jqXHR.status === 200) {
                                r["airline"] = new $426Airline(airline);
                                $426ItinerariesPanel.fill(r);

                            } else {
 
                                this.filling = false;
                                $426_ajax_handle_error(
                                    jqXHR, text, airline,
                                    + "$426ItinerariesPanel.fill() "
                                    + "success: AJAX for "
                                    + "$426Airline.retrieve_by_id "
                                    + "failed."
                                );

                            }

                        },
                        (jqXHR, text, err) => {

                            this.filling = false;
                            $426_ajax_handle_error(
                                jqXHR, text, err,
                                + "$426ItinerariesPanel.fill() "
                                + "error: AJAX for "
                                + "$426Airline.retrieve_by_id "
                                + "failed."
                            );

                        }
                    );

                }

                this.filling = false;
                return;

            }

            this._fill_text(r);

            return true;

        } else {

            this.filling = false;
            return false;

        }

    }

    this._fill_text = (fillPacket) => {

        let out = (
            `<div class="itinerary">`
            + `<div class="itinerary-name"><p>`
            + `${fillPacket["ticket"].get_nameFirst()} `
            + `${fillPacket["ticket"].get_nameMiddle()} `
            + `${fillPacket["ticket"].get_nameLast()}</p></div>`
            + `<div class="itinerary-flight"><div><p>Airline</p>`
            + `<p>${fillPacket["airline"].get_name()}</p>`
            + `</div><div><p>Flight Number</p>`
            + `<p>${fillPacket["flight"].get_number()}</p></div>`
        );
        if (fillPacket["operator"] != null) {
            out = (
                `${out}<div><p>Operated by</p>`
                + `<p>${fillPacket["operator"].get_name()}</p></div>`
            );
        }
        out = (
            `${out}</div><div class="itinerary-instance">`
            + `<div><p>Departs</p>`
            + `<p>${fillPacket["flight"].get_departure_time_string()}</p>`
            + `</div><div><p>Arrives</p> `
            + `<p>${fillPacket["flight"].get_arrival_time_string()}</p>`
            + `</div></div><div class="itinerary-airports"><div><p>`
            + `${$426Airports.get_city(fillPacket["flight"].get_departure_id())}`
            + `</p><p>`
            + `${$426Airports.get_name(fillPacket["flight"].get_departure_id())}`
            + ` (${$426Airports.get_code(fillPacket["flight"].get_departure_id())})`
            + `</p></div><div><p>`
            + `${$426Airports.get_city(fillPacket["flight"].get_arrival_id())}`
            + `</p><p>`
            + `${$426Airports.get_name(fillPacket["flight"].get_arrival_id())}`
            + ` (${$426Airports.get_code(fillPacket["flight"].get_arrival_id())})`
            + `</p></div></div></div>`
        )

        $("div#itineraries-container").append(out);

        this.filling = false;
        return true;

    }

    this.retrieve = (txt) => {

        if (this.filling) {
            return;
        }

        if (txt.search(/[A-Z0-9]{10}/) >= 0) {
            this.clear();
            this.filling = true;
            return $426Itinerary.retrieve_by_code(txt, $426ItinerariesPanel.fill);
        } else if (
            txt.search(/^[a-zA-Z0-9!#$%&'*+\-/=?^_`{|}~.]+@[a-zA-Z0-9.]+\.[a-zA-Z0-9]+$/) >= 0
        ) {
            this._current = false;
            return $426Itinerary.retrieve_by_email(txt, $426ItinerariesPanel.fill);
        } else {
            return false;
        }

        return true;

    }

}

$(document).ready(() => {

    $("input#itineraries-search").on("input", function(e) {
        $426ItinerariesPanel.retrieve(
            $426_sanitize($(e.currentTarget).val())
        );
    });

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
