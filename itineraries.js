// itineraries.JS //
$426ItinerariesPanel = new function() {

    this.fillPacket = function() {
        this.airline = null;
        this.flight = null; 
        this.operator = null;
        this.ticket = null;
    }

    this.clear = () => {
        $("div#itineraries-container").html("");
    }

    this.fill = (r) => {

        if (typeof(r) === "number" && r === -1) {

            console.log("PANIC: Asynchronous request failed.");
            return -1;

        } else if (r instanceof $426Itinerary) {

            return $426Ticket.retrieve_by_itinerary_id(r.get_id(), $426ItinerariesPanel.fill);

        } else if (r instanceof $426Ticket) {

            let pack = new $426ItinerariesPanel.fillPacket();
            pack["ticket"] = r;
            $.when($426Instance.retrieve_by_id(pack["ticket"].get_idInstance())).then(
                (insta) => {

                    insta = new $426Instance(insta);
                    $.when($426Flight.retrieve_by_id(insta.get_flight_id())).then(
                        (flight) => {

                            pack["flight"] = new $426Flight(flight);
                            $426ItinerariesPanel.fill(pack);

                        },
                        (flight) => {

                            console.log(
                                "PANIC: $426Itinerary.fill() panicked on getting "
                                + "the flight."
                            );
                            console.log(`Flight: ${flight}`);

                        });

                },
                (insta) => {

                    console.log("PANIC: $426Itinerary.fill() panicked on getting the instance.");
                    console.log(`Instance: ${insta}`);

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
                        )
                    ).then( 
                        (airline, operator) => {

                            r["airline"] = new $426Airline(airline);
                            r["operator"] = new $426Airline(operator);
                            $426ItinerariesPanel.fill(r);

                        },
                        (airline, operator) => {

                            console.log(
                                "PANIC: $426ItinerariesPanel.fill() "
                                + "panicked on getting the airline "
                                + "and the operator." 
                            );
                            console.log(`Airline: ${airline}`);
                            console.log(`Operator: ${operator}`);

                        });

                } else {

                    $.when(
                        $426Airline.retrieve_by_id(
                            r["flight"].get_airline_id()
                        ),
                    ).then( 
                        (airline) => {

                            r["airline"] = new $426Airline(airline);
                            $426ItinerariesPanel.fill(r);

                        },
                        (airline) => {

                            console.log(
                                "PANIC: $426ItinerariesPanel.fill()"
                                + "panicked on getting the airline." 
                            );
                            console.log(`Airline: ${airline}`);


                        }
                    );

                }

                return;

            }

            let out = (
                `<div class="itinerary">`
                + `<div class="itinerary-name"><p>${r.get_nameFirst()}` 
                + `${r.get_nameMiddle()} ${r.get_nameLast()}</p></div><br>`
                + `<div class="itinerary-flight"><p>Airline</p><p>`
            );

            $("div#itineraries-container").append(out);

            return true;

        } else {

            return false;

        }

    }

    this.retrieve = (txt) => {

        if (txt.search(/[A-Z0-9]{10}/) >= 0) {
            return $426Itinerary.retrieve_by_code(txt, $426ItinerariesPanel.fill); 
        } else if (
            txt.search(/^[a-zA-Z0-9!#$%&'*+\-/=?^_`{|}~.]+@[a-zA-Z0-9.]+\.[a-zA-Z0-9]+$/) >= 0
        ) {
            return $426Itinerary.retrieve_by_email(txt, $426ItinerariesPanel.fill);
        } else {
            return false;
        }

        return true;

    } 

}

$(document).ready(() => {

    $("div#itineraries").addClass("itineraries-showww");

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
