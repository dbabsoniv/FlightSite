// TICKET.JS //
$426TicketPanel= new function() {

    this.clear = () => {}
    this.hide = () => {
        $("div#ticket").removeClass("ticket-show");
    }
    this.show = () => {
        $("div#ticket").addClass("ticket-show");
    }

}

$(document).ready(() => {

    $("div#ticket-button-temp").click(function(e) {
        $426Map.reset();
        $426TicketPanel.hide();
        $426Controls.show();
        $426TicketPanel.clear()
    });

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
