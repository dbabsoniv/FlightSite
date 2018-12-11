// TICKET.JS //
var $426TicketPanel= new function() {

    this._code = null;
    this._creating = false;
    this._flight = null;
    this._instance = null;
    this._itinerary = null;
    this._plane = null;
    this._price = null;

    // Step 0: Closed
    // Step 1: Information
    // Step 2: Seat
    // Step 3: Confirmation Code
    this._step = 0;

    this.clear = () => {

        $("div#ticket-where").html("");
        $("div#ticket-content").html("");
        // Removes all classes.
        $("div#ticket-content").removeClass();
        $("div#ticket-button-next").removeClass("hidden");

        this._code = null;
        this._flight = null;
        this._instance = null;
        this._itinerary = null;
        this._plane = null;
        this._price = null;
        this._step = 0;

    }
    this.close = () => {

        this.hide();
        $426FlightsPanel.show();
        this.clear();

    }

    this.confirmation = () => {

        this._creating = false;
        this._step = 3;
        let div = $("div#ticket-content");

        div.removeClass();
        div.addClass("ticket-confirmation");
        $("div#ticket-button-next").addClass("hidden");
        div.html(
            `<h1>Success! Your Confirmation Code:</h1><h1>${this._code}</h1>`
        );

    }

    this.done = () => {

        this.hide();
        $426Map.reset();
        setTimeout(this.clear, 2000);

    }

    this.get_step = () => { return this._step; }

    this.hide = () => {
        $("div#ticket").removeClass("ticket-show");
    }

    this.input_information = () => {

        if (this._creating) {
            return -1;
        }
         
        let age = +$("select#ticket-age").val();
        let date = $426_sanitize($("input#ticket-date").val());
        let email = $426_sanitize($("input#ticket-email").val());
        let gender = $426_sanitize($("input#ticket-gender").val());
        let nameFirst = $426_sanitize($("input#ticket-first").val());
        let nameMiddle = $426_sanitize($("input#ticket-middle").val());
        let nameLast = $426_sanitize($("input#ticket-last").val());
        let sal = $426_sanitize($("input#ticket-sal").val());
        let suffix = $426_sanitize($("input#ticket-suffix").val());

        let ret = true;

        if (
            email === ""
            || email.search(/^[a-zA-Z0-9!#$%&'*+\-/=?^_`{|}~.]+@[a-zA-Z0-9.]+\.[a-zA-Z0-9]+$/) < 0
        ) {
            $("input#ticket-email").addClass("illegal")
            setTimeout(function() {
                    $("input#ticket-email").removeClass("illegal");
                }, 1500
            );
            ret = false;
        }
        if (gender === "") {
            $("input#ticket-gender").addClass("illegal")
            setTimeout(function() {
                    $("input#ticket-gender").removeClass("illegal");
                }, 1500
            );
            ret = false;
        }
        if (nameFirst === "") {
            $("input#ticket-first").addClass("illegal")
            setTimeout(function() {
                    $("input#ticket-first").removeClass("illegal");
                }, 1500
            );
            ret = false;
        }
        if (nameLast === "") {
            $("input#ticket-last").addClass("illegal")
            setTimeout(function() {
                    $("input#ticket-last").removeClass("illegal");
                }, 1500
            );
            ret = false;
        }

        let r = $426Instance.create(
            // FIXME Currently not supporting seats.
            date, this._flight, "", (insta) => {
                
                if (typeof(insta) === "number" && insta === -1) {

                    console.log(
                        "PANIC: $426TicketPanel.input_information() "
                        + "could not create instance via " 
                        + "$426Instance.create(). Asynchronous error."
                        + `Error Code: ${insta}`
                    )

                } else {

                    this._instance = insta;
                    if (this._code != null && this._itinerary != null) {
                        create();
                    }

                }

        });
        if (typeof(r) === "number") {

            if (r === -6) {

                $("input#ticket-date").addClass("illegal")
                setTimeout(function() {
                        $("input#ticket-date").removeClass("illegal");
                    }, 2000
                );
                ret = false;
    
            } else { 

                console.log(
                    "PANIC: $426TicketPanel.input_information() "
                    + "could not create instance via "
                    + "$426Instance.create. Bad parameters. "
                    + `Error Code: ${r}`
                );
                return r;

            }
        }

        if (ret === false) {
            return false;
        }

        this._creating = true;

        let itinerary_create = (email) => {

            this._code = $426Itinerary.generate_code();  
            $426Itinerary.create(this._code, email, (itin) => {

                if (typeof(itin) === "boolean" && !itin) {

                    itinerary_create(email);

                } else if (typeof(itin) === "number") {

                    console.log(
                        "PANIC: $426TicketPanle.input_information() "
                        + "could not create itinerary via "
                        + "$426Itinerary.create(). Asynchronous error. "
                        + `Error Code: ${r}`
                    );

                } else {

                    this._itinerary = itin;
                    if (this._instance != null) {
                        create()
                    }

                }
    

            });

        }
        r = itinerary_create(email);
        if (typeof(r) === "number") {
            console.log(
                "PANIC: $426TicketPnael.input_information() "
                + "could not create itinerary via "
                + "$426Itinerary.create(). Bad parameters. "
                + `Error Code: ${r}` 
            );
            return r;
        }

        let create = () => {

            r = $426Ticket.create(
                age,
                gender,
                this._instance.get_id(),
                this._itinerary.get_id(),
                nameFirst,
                nameMiddle,
                nameLast,
                sal,
                suffix,
                this._price,
                //FIXME Seats are currently not supported.
                "",
                (ticket) => {

                    if (typeof(ticket) === "number") {
                        console.log(
                            "PANIC: $426TicketPanel.input_information() "
                            + "could not create ticket via "
                            + "$426Ticket.create(). Asynchronous error. "
                            + `Error Code: ${ticket}`
                        );
                        return ticket;
                    } else {
                        this.confirmation();
                    }

                }
            );
            if (typeof(r) === "number") {
                console.log(
                    "PANIC: $426TicketPanel.input_information() "
                    + "could not create ticket via "
                    + "$426Ticket.create(). Bad parameters. "
                    + `Error Code: ${r}`
                );
                return r;
            }

        }

        return ret;

    }

    this.input_seat = () => {}

    this.show_ticket = (codeDest, codeSrc, flight, number, plane, price) => {

        this._flight = flight;
        this._plane = plane;
        this._price = price;

        let div = $("div#ticket-content");
        div.addClass("ticket-information");
        let now = new Date();

        let day = now.getDate() + 1;
        let month = now.getMonth() + 1;
        let year = now.getFullYear();

        switch (month) {

            case 2:

                if (
                    day > 29 ||
                    (day > 28 && year % 4 === 0)
                ) {
                    day = 1;
                    month = 3;
                }
                break;

            case 1:
            case 3:
            case 5:
            case 7:
            case 8:
            case 10:
            case 12:

                if (day > 31) {
                    day = 1;
                    month += 1;
                }
                break;

            case 4:
            case 6:
            case 9:
            case 11:

                if (day > 30) {
                    day = 1;
                    month += 1;
                }
                break;

            default:

        }

        if (month > 12) {
            day = 1;
            month = 1;
            year += 1;
        }      
            
        $("div#ticket-where").html(
            `<p>${number}</p><p>${codeSrc} ⇒ ${codeDest}</p>`
        );

        let out = (
            `<div>`
            + `<input id="ticket-sal" type="text" maxlength="11" `
            + `autocomplete="off" `
            + `placeholder="Honorific"><input id="ticket-first"`
            + `autocomplete="off" `
            + `type="text" maxlength="512" placeholder="First Name">`
            + `</div><div><input id="ticket-middle" maxlength="512" `
            + `autocomplete="off" `
            + `placeholder="Middle Name" type="text"></div><div>`
            + `<input id="ticket-last" maxlength="512" placeholder=`
            + `"Last Name" type="text" autocomplete="off">`
            + `<input id="ticket-suffix" autocomplete="off"`
            + `maxlength="10" placeholder="Suffix" type="text"></div>`
            + `<div><p>Depature&nbsp;Date</p><input id="ticket-date" `
            + `type="date" value="${year}-${month}-${day}" min="`
            + `${now.getFullYear()}-${now.getMonth()+1}-`
            + `${now.getDate()}" max="${now.getFullYear()+1}-`
            + `${now.getMonth()+1}-${now.getDate()}">`
            + `<p>Age</p><select id="ticket-age">`
        );
        for (let i = 1; i < 131; ++i) {
            out = `${out}<option value="${i}">${i}</option>`;
        }
        out = (
            `${out}</select><input id="ticket-gender" maxlength="256" `
            + `autocomplete="off" `
            + `placeholder="Gender" type="text"></div>`
            + `<div><input id="ticket-email" maxlength="512" placeholder=`
            + `"Email Address" autocomplete="off" type="text"></div>`
        );
        div.html(out);
        this._step = 1;
        $("div#ticket").addClass("ticket-show");

    }

}

$(document).ready(() => {

    $("div#ticket-button-back").click(function(e) {

        switch($426TicketPanel.get_step()) {

            case 0:
                $426TicketPanel.done();
                break;
            case 1:
                $426TicketPanel.close();
                break;
            case 2: // Not suportted without seat interface. 
                break;
            case 3:
                $426TicketPanel.done();
                break;
            default:
                $426TicketPanel.done();

        }

    });

    $("div#ticket-button-next").click(function(e) {

        switch($426TicketPanel.get_step()) {

            case 0:
                $426TicketPanel.done();
                break;
            case 1:
                $426TicketPanel.input_information();
                break;
            case 2: // Not suportted without seat interface. 
                break;
            case 3: // Should never be visible.
                $426TicketPanel.done();
                break;
            default:
                $426TicketPanel.done();

        }

    });

    return;

    //recieve airport codes for start (1) and destination (2)
    portCode1 = "ATL";
    portCode2 = "MSN";
    //retrieve all flights between these two
    
    
    //list these flights (limit to an amount, 5 maybe?)
    //include details:
    //  - LEAVE ROOM FOR AIRLINE LOGO
    //  - departure time
    //  - airline name
    //  - ticket price
    //  - Aircraft operator (in the case of Endeavor)
    
    //  enter name, age, gender, email address, ...

    //once a choice is selected, show seating chart
    ////- scrollable window
    ////- use invisible boxs (using different style) to add an isle appearance
    ////- taken seats are stored in array in instance , e.g. '12B'
    ////
    ////- more than 15 rows, use integer division to make that row red ('exit isle')
    var scheme = "1|1|6";
    var tempAisleCount = "";
    var aisleCount=0;
    var seats = [];
    for(var i=0; i<scheme.length; i++) {
        if(scheme.charAt(i) == '|') {
            aisleCount++;
            seats.push( parseInt(tempAisleCount) );
            tempAisleCount = "";
        }
        else
            tempAisleCount += scheme.charAt(i);
    }
    seats.push( parseInt(tempAisleCount) );
    
    var leftSeats = seats[0];
    var rightSeats = 0;
    if(seats.length>1) rightSeats = seats[1];
    var rightRightSeats = 0;
    if(seats.length>2) rightRightSeats = seats[2];
    
    var takenArray = ["1A", "1D", "2C", "4A", "4B", "4C", "4D", "5E", "6F"];
    var rows = 5;
    for(var row=0; row<rows; row++) {
        console.log("---- row "+row+" ----");
        var newSeat;
        var isAisleAdded = false;
        var isNextAisleAddded = false;
        for(var seat=0; seat<leftSeats+rightSeats+rightRightSeats; seat++) {
            if(!isAisleAdded && seat==leftSeats) { //is aisle
                newSeat = "<div class='aisle-block'></div>";
                isAisleAdded = true;
                seat--;
            }
            else if(!isNextAisleAddded && seat==leftSeats+rightSeats) {
                newSeat = "<div class='aisle-block'></div>";
                isNextAisleAddded = true;
                seat--;
            }
            else if(isFreeSeat(row, seat, takenArray)) {
                newSeat = "<div class='seat'></div>";
                //newSeat. 'data-seatNumber' set data value to determine the seat
            }
            else
                newSeat = "<div class='taken-seat'></div>";
            
            $("#ticket").append(newSeat);
        }
        $("#ticket").append("<div class='seat-seperator'></div>");
        
    }
    
    
    //ask for confirmation, then create ticket
    
    //add ticket to itineraries
    
 
});

function isFreeSeat(row, seat, takenArray) {
    var newString = row+1+"";
    if(seat==0) newString+="A";
    if(seat==1) newString+="B";
    if(seat==2) newString+="C";
    if(seat==3) newString+="D";
    if(seat==4) newString+="E";
    if(seat==5) newString+="F";
    if(seat==6) newString+="G";
    if(seat==7) newString+="H";
    if(seat==8) newString+="I";
    if(seat==9) newString+="J";
    if(seat==10) newString+="K";
    if(seat==11) newString+="L";
    if(seat==12) newString+="M";
    if(seat==13) newString+="N";
    if(seat==14) newString+="O";
    if(seat==15) newString+="P";
    if(seat==16) newString+="Q";
    
    
    console.log(newString);
    
    for(var i=0; i<takenArray.length; i++)
        if(takenArray[i] == newString)
            return false;
    return true;
}
