// TICKET.JS //
$426TicketPanel= new function() {

    this.flight = null;
    this.plane = null;
    this.price = null;

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
        this._flight = null;
        this._plane = null;
        this._price = null;
        this._step = 0;

    }
    this.close = () => {

        this.hide();
        $("div#flights").addClass("flights-show");
        this._flight = null;
        this._plane = null;
        this._price = null;
        this._step = 0;

    }

    this.confirmation = (code) => {

        

    }

    this.done = () => {

        this.hide();
        $426Map.reset();
        this.clear();

    }

    this.get_step = () => { return this._step; }

    this.hide = () => {
        $("div#ticket").removeClass("ticket-show");
    }

    this.input_information = () => {

         
        let code = $426Itinerary.generate_code();  
        let date = $426_sanitize($("input#ticket-date").val());
        let email = $426_sanitize($("input#ticket-email").val());
        let nameFirst = $426_sanitize($("input#ticket-first").val());
        let nameMiddle = $426_sanitize($("input#ticket-middle").val());
        let nameLast = $426_sanitize($("input#ticket-last"),val());
        let sal = $426_sanitize($("input#ticket-sal").val());
        let suffix = $426_santize($("input#ticket-suffix").val());


    }

    this.input_seat = () => {}

    this.show_ticket = (codeDest, codeSrc, flight, number, plane, price) => {

        this._flight = flight;
        this._plane = plane;
        this._price = price;

        let div = $("div#ticket-content");
        div.addClass("ticket-information");
        let now = new Date();

        $("div#ticket-where").html(
            `<p>${number}</p><p>${codeSrc} ⇒ ${codeDest}</p>`
        );

        out = (
            `<div>`
            + `<input id="ticket-sal" type="text" maxlength="11"`
            + `placeholder="Salutations"><input id="ticket-first"`
            + `type="text" maxlength="512" placeholder="First Name">`
            + `</div><div><input id="ticket-middle" maxlength="512" `
            + `placeholder="Middle Name" type="text"></div><div>`
            + `<input id="ticket-last" maxlength="512" placeholder=`
            + `"Last Name" type="text"><input id="ticket-suffix" `
            + `maxlength="10" placeholder="Suffix" type="text"></div>`
            + `<div><input id="ticket-date" type="date" `
            + `value="${now.getFullYear()}-`
            + `${now.getMonth()+1}-${now.getDate()}" min="`
            + `${now.getFullYear()}-${now.getMonth()+1}-`
            + `${now.getDate()}" max="${now.getFullYear()+1}-`
            + `${now.getMonth()+1}-${now.getDate()}">`
            + `<input id="ticket-gender" maxlength="256" `
            + `placeholder="Gender" type="text"></div>`
            + `<div><input id="ticket-email" maxlength="512" placeholder=`
            + `"Email Address" type="text"></div>`
            
        )
        div.html(out);
        this.step = 1;
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
                $426TicketPanel.purchase();
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

    $426TicketPanel.show_ticket(
        "ATL",
        "CLT",
        "500000",
        "DAL 500",
        "100",
        "123.45"
    );


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
