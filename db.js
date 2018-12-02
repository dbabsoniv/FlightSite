//TODO REMEMBER TO CLEAN ALL USER INPUT.
//TODO USER INPUT MUST HAVE A MAX LENGTH INPUT.
//
//FIXME All depature times are local time
//FIXME Arrival times are local to depature city, NOT destination
//city.
//FIXME There are exteneral libraries to translate Lat/Long to a
//timezone, but regardless we have to make some sort of decision.
//
// Because of promises, code outside of the database interface will
// have to handle jqXHR status codes.
// Whenever this is the case, the function should say how to do
// this.
//
// Sanitation should occur the moment the input is collected. None
// of these objects and functions check for sanitation. It's
// assumed sanitation occurs long before strings get here.
//
// There must be some sort of guide to the website using a "?" icon.

$426_ROOT_URL = "http://comp426.cs.unc.edu:3001/"

// This is a next level of silly, but the JS throws an error on load
// if you don't set it to *something*.
$426Airports = undefined;

$426Airline = function(oData) {

    // Returns this airline's ID, an integer.
    this.get_id = () => { return oData["id"]; }
    // Returns this airline's logoURL. It's just a filename.
    this.get_logoURL = () => { return oData["logo_url"]; }
    // Return this airline's name.
    this.get_name = () => { return oData["name"]; }

}

/*
 *
 */
$426Airline.retrieve_by_id = function(id) {
    return _db_retrieve_by_id(id, "airlines/");
}

$426Flight = function(oData) {

    // Airline to be presented in the case of Endeavor Air is Delta.
    this.get_airline_id = () => { 
        let stored = oData["airline_id"];
        if (stored === 83) {
            return 82;
        } else {
            return stored;
        }
    }

    this.get_arrival_id = () => { return oData["arrival_id"]; }

    this.get_arrival_time_raw = () => {
        return $426Flight.time_string_to_raw(oData["arrives_at"]);
    }

    this.get_arrival_time_string = () => { 
        return oData["arrives_at"].replace(/^2000-01-01T/g, "").replace(/:00\.000Z$$/g, "");
    }

    this.get_departure_id = () => { return oData["departure_id"]; }

    this.get_departure_time_raw = () => {
        return $426Flight.time_string_to_raw(oData["departs_at"]);
    }

    this.get_departure_time_string = () => {
        return oData["departs_at"].replace(/^2000-01-01T/g, "").replace(/:00\.000Z$$/g, "");
    }

    // Use .toLocaleString() before putting it into HTML to include
    // commas and such.
    this.get_distance_km = () => {
        return +oData["info"];
    }

    this.get_distance_m = () => {
        return Math.ceil(+oData["info"] * 0.621371)
    }

    // Endeavor Air is an operator, not an airline.
    this.get_operator_id = () => {

        if (oData["airline_id"] === 83) {
            return 83;
        } else {
            return null;
        } 

    }

    this.get_plane_id = () => { return oData["plane_id"]; }
    // Includes airline code. e.g. "AA 155"
    this.get_number = () => { return oData["number"]; }

}
$426Flight.get_flights = function (id_src, id_dest, func) {

    if (typeof(id_src) !== "number") {
        return -1;
    } else if (typeof(id_dest) !== "number") {
        return -2;
    } else if (!(func instanceof Function)) {
        return -3;
    }
    let ids_flights = $426Airports.airports[id_src]["info"][id_dest];
    if (ids_flights === undefined) {
        return false;
    }

    for (const id_flight of ids_flights) {

        $.ajax(
            encodeURI(`${$426_ROOT_URL}flights/${id_flight}`),
            {
                
                datatype: "json",
                error: (jqXHR, text, err) => {
                    $426_ajax_handle_error(
                        jqXHR, text, err,
                        "$426Flight.get_flight error"
                    );
                }, 
                success: (data, text, jqXHR) => {
                    if (jqXHR["status"] !== 200 || data == null) {
                        $426_ajax_handle_error(
                            jqXHR, text, data,
                            "$426Flight.get_flight success"
                        )
                        func(-1);
                    } else {
                        func(new $426Flight(data));
                    }
                },
                type: "GET",
                xhrFields: { withCredentials: true },
 
            }
        );

    }

    return true;

}
$426Flight.retrieve_by_id = function(id) {
    return _db_retrieve_by_id(id, "flights/");
}
/*
 * A "raw" time is in base of minutes, so 15:15 is 915. 
 */
$426Flight.time_string_to_raw = function(time) {

    if (typeof(time) !== "string") {
        return false;
    } else {
        time = time.replace(/^2000-01-01T/g, "").replace(/:00\.000Z$$/g, "");
        return parseInt(time.replace(/:\d{2}$/g, "")) * 60 + parseInt(time.replace(/^\d{2}:/g, ""));
    }

}

$426Instance = function(oData) {

    oData["info"] = JSON.parse(oData["info"]);
    if (oData["info"] === null) {
        oData["info"] = [];
    }

    this.add_seat = (seat) => {

        if (typeof(seat) !== "string") {
            return -1;
        } else if (seat.search(/^\d{1,2}[A-O]$/) < 0) {
            return -2;
        }

        for (const s of oData["info"]) {
            if (s === seat) {
                return false;
            }
        }
        oData["info"].push(seat);

        return true;

    }

    this.get_date = () => { return oData["date"]; }
    this.get_flight_id = () => { return oData["flight_id"]; }
    this.get_id = () => { return oData["id"]; }
    this.get_seats = () => { return oData["info"]; }

    /*
     * On return check jqXHR["status"] === 200. 
     */ 
    this.patch = () => {

        // This line must be included. Stop trying to take it out
        // REPIII.
        oData["info"] = JSON.stringify(oData["info"]);

        return $.ajax(
            `${$426_ROOT_URL}instances/${encodeURIComponent(oData["id"])}`,
            {

                context: this,
                data: {
                    instance: oData
                },
                datatype: "json",
                error: (jqXHR, text, err) => {
                    $426_ajax_handle_error(
                        jqXHR, text, err,
                        "$426Instance.patch success"
                    ); 
                },
                type: "PUT",
                xhrFields: { withCredentials: true },

            }
        );

    }

}

/*
 * $426Instance.create() is "smart". If you attempt to create a new
 * instance that already exists, it hands you back that already
 * existant instance.
 * It does this silently though.
 *
 * //TODO February 31st is "legal" currently. More checks are necessary.
 *
 */
$426Instance.create = function(date, idFlight, seat, func) {

    if (typeof(date) !== "string") {

        return -1;

    } else if (date.search(/^\d{4}-\d{2}-\d{2}$/) < 0) {

        return -5;

    } else {

        let daten = date.split("-");

        if (
            typeof(daten[0]) === "undefined"
            || typeof(daten[1]) === "undefined"
            || typeof(daten[2]) === "undefined"
        ) {

            return -5;

        }

        let now = new Date();

        if (+daten[0] < now.getFullYear()) {

            return -6;

        } else if (+daten[0] === now.getFullYear()) {

            if (+daten[1] < (now.getMonth() + 1) || +daten[1] > 12) {

                return -6;

            // Month is indexed from 0. Jan === 0.
            } else if (
                (+daten[1] === (now.getMonth() + 1)
                && +daten[2] <= now.getDate())
                || daten[2] > 31
            ) {

                return -6;

            }

        }

    }

    if (typeof(idFlight) !== "number") {
        return -2;
    } else if (idFlight < 1836 || idFlight > 18691) {
        return -7;
    } else if (typeof(seat) !== "string") {
        return -3;
    } else if (seat.match(/^\d{1,2}[A-O]$/) === null) {
        return -8
    } else if (!(func instanceof Function)) {
        return -4;
    }

    return $.ajax(
        encodeURI(`${$426_ROOT_URL}instances?filter[date]=${date}`),
        {

            context: this,
            datatype: "json",
            error: (jqXHR, text, err) => {
                $426_ajax_handle_error(
                    jqXHR, text, err,
                    "$426Instance.create error"
                );
            },
            success: (data, text, jqXHR) => {

                if (jqXHR["status"] !== 200) {

                    $426_ajax_handle_error(
                        jqXHR, text, err,
                        "$426Instance.create success"
                    );
                    func(-1);
                    return;

                }

                if (
                    data == null
                    || !Array.isArray(data)
                    || data.length < 1
                ) {

                    $426Instance._create(date, idFlight, seat, func); 

                } else {

                    for (const insta of data) {

                        if (insta["date"] === date && insta["flight_id"] === +idFlight) {
                            func(new $426Instance(insta));
                            return;
                        } 

                    }

                    $426Instance._create(date, idFlight, seat, func);

                }

            },
            type: "GET",
            xhrFields: { withCredentials: true },

        }
    );

}
$426Instance._create = function(date, idFlight, seat, func) {

    const pack = {
        date: date,
        flight_id: idFlight,
        info: JSON.stringify([seat])
    }; 

    $.ajax(
        `${$426_ROOT_URL}instances`,
        {

            context: this,
            data: {
                instance: pack
            },
            datatype: "json",
            error: (jqXHR, text, err) => {
                $426_ajax_handle_error(
                    jqXHR, text, err,
                    "$426Instance._create error"
                ); 
            },
            success: (data, text, jqXHR) => {

                if (jqXHR["status"] !== 201 || date == null) {

                    $426_ajax_handle_error(
                        jqXHR, text, data,
                        "$426Instance._create success"
                    )
     
                    func(-1);

                } else {

                    func(new $426Instance(data)); 

                }

            },
            type: "POST",
            xhrFields: { withCredentials: true },
        }
    );

}
$426Instance.retrieve_by_id = function(id) {
    return _db_retrieve_by_id(id, "instances/");
}

//date can be null. idFlight cannot be null, although this function
//works "fine" if idFlight is illegal. The AJAX call will just fail.
//The given func must handle that error.
$426Instance.retrieve_by_flight_id_and_date = function(idFlight, date, func) {

    if (idFlight == null) {
        return false;
    }

    if (date == null || typeof(date) !== "string" || date === "") {

        $.ajax(
            `${$426_ROOT_URL}instances`,
            {

                context: this,
                datatype: "json",
                error: (jqXHR, text, err) => {
                    $426_ajax_error_handler(
                        jqXHR, text, err,
                        "$426Instance.retrieve_by_flight_id_and_date error"
                    );
                },
                success: (data, text, jqXHR) => {

                    if (jqXHR["status"] !== 200 || !Array.isArray(data)) {

                        $426_ajax_error_handler(
                            jqXHR, text, data,
                            "$426Instance.retrieve_by_flight_id_and_date success"
                        );
                        func(-1);
                        return;

                    } else if (data.length < 1) {

                        $426_ajax_error_handler(
                            jqXHR, text, data,
                            "$426Instance.retrieve_by_flight_id_and_date success"
                        );
                        func(false);
                        return;

                    }

                    for (const insta of data) {
                        if (insta["flight_id"] === +idFlight) {
                            func(new $426Instance(insta));
                        }
                    }

                },
                type: "GET",
                xhrFields: { withCredentials: true },

            }
        );

    } else {

        $.ajax(
            encodeURI(`${$426_ROOT_URL}instances?filter[date]=${date}`),
            {

                context: this,
                datatype: "json",
                error: (jqXHR, text, err) => {
                    $426_ajax_error_handler(
                        jqXHR, text, err,
                        "$426Instance.get_by_flight_id_and_date error"
                    );
                },
                success: (data, text, jqXHR) => {

                    if (jqXHR["status"] !== 200 || !Array.isArray(data)) {

                        $426_ajax_error_handler(
                            jqXHR, text, data,
                            "$426Instance.get_by_flight_id_and_date success"
                        );
                        func(-1);
                        return;

                    } else if (data.length < 1) {

                        $426_ajax_error_handler(
                            jqXHR, text, data,
                            "$426Instance.get_by_flight_id_and_date success"
                        );
                        func(false);
                        return;

                    } 

                    for (const insta of data) {
                        if (insta["flight_id"] === +idFlight) {
                            func(new $426Instance(insta));
                        }
                    }

                },
                type: "GET",
                xhrFields: { withCredentials: true },

            }
        );

    }

    return true;

}
$426Itinerary = function(oData) {

    this.get_code = () => { return oData["confirmation_code"]; }
    this.get_email = () => { return oData["email"]; }
    this.get_id = () => { return oData["id"]; }

}
$426Itinerary.create = function(code, email, func) {

    // That email regex is not remotely meant to be exhaustive.
    // It's simple. Illegal addresses can pass through, but you
    // have to think about how to trick it. And that's good enough.

    if (typeof(code) !== "string") {
        return -1;
    } else if (typeof(email) !== "string") {
        return -2;
    } else if (!(func instanceof Function)) {
        return -3
    } else if (
        email.search(
        /^[a-zA-Z0-9!#$%&'*+\-/=?^_`{|}~.]+@[a-zA-Z0-9.]+\.[a-zA-Z0-9]+$/
        ) < 0
    ) { 
        return -4; 
    } else if (code.search(/^[\dA-Z]{10}$/) < 0) {
        return -5;
    }

    return $426Itinerary.retrieve_by_code(code, (r) => {

        //console.log(r);

        if (r === false) {
         
            const pack = {
                "confirmation_code" : code,
                "email" : email
            }; 

            $.ajax(
                `${$426_ROOT_URL}itineraries`,
                {

                    data: {
                        itinerary: pack
                    },
                    datatype: "json",
                    error: (jqXHR, text, err) => {
                        $426_ajax_handle_error(
                            jqXHR, text, err,
                            "$426Itinerary.create error"
                        );
                    },
                    success: (data, text, jqXHR) => {

                        if (jqXHR["status"] !== 201 || data == null) {

                            $426_ajax_handle_error(
                                jqXHR, text, data,
                                "$426Itinerary.create success"
                            );
                            func(-1);
                            return;

                        }

                        func(new $426Itinerary(data));
                        
                    },
                    type: "POST",
                    xhrFields: { withCredentials: true },
                    
                }
            );
           
        } else {

            if (typeof(r) === "number") {
                func(r);
            } else {
                func(false);
            }

        } 

    });

}
// Returns a 10 character string of random alphanumeric
// characters. There is no guarentee that this code is unique in
// the DB, and that MUST be checked.
$426Itinerary.make_code = function() {

    let legal = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let out = "";

    for (let i = 0; i < 10; ++i) {
        out += legal[Math.floor(Math.random() * 36)];
    }

    return out;

}
$426Itinerary.retrieve_by_code = function(code, func) {

    if (typeof(code) !== "string" ) {
        return -1;
    } else if (!(func instanceof Function)) {
        return -2;
    } else if (code.search(/^[\dA-Z]{10}$/) < 0) {
        return -3;
    }

    $.ajax(
        encodeURI(
            `${$426_ROOT_URL}itineraries?filter[confirmation_code]=${code}`
        ),
        {

            datatype: "json",
            error: (jqXHR, text, err) => {
                $426_ajax_handle_error(
                    jqXHR, text, err,
                    "$426Itinerary.retrieve_by_code error"
                );
            },
            success: (data, text, jqXHR) => {

                if (jqXHR["status"] !== 200 || !Array.isArray(data)) {

                    $426_ajax_handle_error(
                        jqXHR, text, data,
                        "$426Itinerary.retrieve_by_code success"
                    );
                    func(-1);
                    return;

                } else if (data.length !== 1) {

                    $426_ajax_handle_error(
                        jqXHR, text, data,
                        "$426Itinerary.retrieve_by_code success"
                    );
                    func(false);
                    return;

                }

                func(new $426Itinerary(data[0]));

            },
            type: "GET",
            xhrFields: { withCredentials: true },

        }
    );

    return true;

} 
$426Itinerary.retrieve_by_email = function(email, func) {

    if (typeof(email) !== "string") {
        return -1;
    } else if (!(func instanceof Function)) {
        return -2;
    }

    return $.ajax(
        encodeURI(
            `${$426_ROOT_URL}itineraries?filter[email]=${email}`
        ),
        {

            datatype: "json",
            error: (jqXHR, text, err) => {
                $426_ajax_handle_error(
                    jqXHR, text, err,
                    "$426Itinerary.retrieve_by_email error"
                );
            },
            success: (data, text, jqXHR) => {

                if (jqXHR["status"] !== 200 || !Array.isArray(data)) {

                    $426_ajax_handle_error(
                        jqXHR, text, data,
                        "$426Itinerary.retrieve_by_email success"
                    );

                    func(-1);
                    return;

                } else if (data.length < 1) {

                    $426_ajax_handle_error(
                        jqXHR, text, data,
                        "$426Itinerary.retrieve_by_email success"
                    );

                    func(-2);
                    return;

                }

                for (const itin of data) {
                    func(new $426Itinerary(itin));
                } 

            },
            type: "GET",
            xhrFields: { withCredentials: true },

        }
    );

}
$426Itinerary.retrieve_by_id = function(id) {
    return _db_retrieve_by_id(id, "itineraries/");
}

$426Plane = function(oData) {

    oData["info"] = JSON.parse(oData["info"]);

    this.get_name = () => { return oData["name"]; }
    this.get_rows = () => { return +oData["info"]["rows"]; }
    // Scheme is NOT translated in any way. It's a raw string.
    this.get_scheme = () => { return oData["info"]["scheme"]; }

}
$426Plane.retrieve_by_id = function(id) {
    return _db_retrieve_by_id(id, "planes/");
}

$426Ticket = function(oData) {

    this.get_age = () => { return oData["age"]; }
    this.get_gender = () => { return oData["gender"]; }
    this.get_idInstance = () => { return oData["instance_id"]; }
    this.get_idItinerary = () => { return oData["itinerary_id"]; }
    this.get_nameFirst = () => { return oData["first_name"]; }
    this.get_nameLast = () => { return oData["last_name"]; }
    this.get_nameMiddle = () => { return oData["middle_name"]; }
    this.get_seat = () => { return oData["info"]; }

}
$426Ticket._check_tickets = function(pack) {

    return new Promise((resolve, reject) => {

        $.ajax(
            `${$426_ROOT_URL}tickets?`
            + `filter[age]=${encodeURIComponent(pack["age"])}`
            + `&filter[gender]=${encodeURIComponent(pack["gender"])}`
            + `&filter[instance_id]=${encodeURIComponent(pack["instance_id"])}`
            + `&filter[itinerary_id]=${encodeURIComponent(pack["itinerary_id"])}`
            + `&filter[info]=${encodeURIComponent(pack["info"])}`
            + `&filter[first_name]=${encodeURIComponent(pack["first_name"])}`
            + `&filter[midddle_name]=${encodeURIComponent(pack["middle_name"])}`
            + `&filter[last_name]=${encodeURIComponent(pack["last_name"])}`,
            {

                context: this,
                datatype: "json",
                error: (jqXHR, text, err) => {
                    $426_ajax_handle_error(
                        jqXHR, text, err,
                        "$426Ticket._check_tickets error"
                    );
                    reject(-4);
                },
                success: (data, text, jqXHR) => {

                    console.log(`Filtered: ${data}`);

                    if (jqXHR["status"] !== 200) {
                        reject(-5);
                        return;
                    } else if (data == null || !Array.isArray(data)) {
                        reject(-6);
                        return;
                    }

                    for (const tick of data) {

                        if (
                            tick["age"] == pack["age"]
                            && tick["gender"] == pack["gender"]
                            && tick["instance_id"] == pack["instance_id"]
                            && tick["itinerary_id"] == pack["itinerary_id"]
                            && tick["info"] == pack["info"]
                            && tick["first_name"] == pack["first_name"]
                            && tick["middle_name"] == pack["middle_name"]
                            && tick["last_name"] == pack["last_name"]
                        ) {
                            reject(tick);
                        }
                    }

                    resolve();

                },
                type: "GET",
                xhrFields: { withCredentials: true },

            }
        );

    });

}
// Seat is a string like "B14", not an Object or an ID.
$426Ticket.create = function(
    age,
    gender,
    idInstance,
    idItinerary,
    nameFirst,
    nameMiddle,
    nameLast,
    nameSal,
    nameSuffix,
    seat,
    func,
) {

    if (typeof(age) !== "number") {
        return -1;
    } else if (typeof(gender) !== "string") {
        return -2;
    } else if (typeof(idInstance) !== "number") {
        return -3;
    } else if (typeof(idItinerary) !== "number") {
        return -4;
    } else if (typeof(nameFirst) !== "string") {
        return -5;
    } else if (typeof(nameMiddle) !== "string") {
        return -6;
    } else if (typeof(nameLast) !== "string") {
        return -7;
    } else if (typeof(nameSal) !== "string") {
        return -8;
    } else if (typeof(nameSuffix) !== "string") {
        return -9;
    } else if (typeof(seat) !== "string") {
        return -10;
    } else if (!(func instanceof Function)) {
        return -11;
    } else if (seat.match(/^\d{1,2}[A-O]$/) === null) {
        return -12;
    }

    return $.when(
        $426Instance.retrieve_by_id(idInstance),
        $426Itinerary.retrieve_by_id(idItinerary)
    ).then(
        $.proxy((r1, r2) => {

            if (r1[0] == null) {
                func(-1);
                return;
            } else if (r2[0] === null) {
                func(-2);
                return;
            } 
 
            // Seat is a required property, but our scheme doesn't
            // use it. There is a dummy seat resource in the DB, and
            // its ID is 3.
            const pack = {
                age: age,
                gender: gender,
                instance_id: idInstance,
                itinerary_id: idItinerary,
                info: seat,
                is_purchased: true,
                first_name: `${nameSal} ${nameFirst}`,
                middle_name: nameMiddle,
                last_name: `${nameLast} ${nameSuffix}`,
                seat_id: 3,
            } 

            $.when($426Ticket._check_tickets(pack)).then(
                $.proxy(() => {

                    $.ajax(
                        `${$426_ROOT_URL}tickets`,
                        {

                            context: this,
                            data: {
                                ticket: pack
                            },
                            datatype: "json",
                            error: (jqXHR, text, err) => {
                                $426_ajax_handle_error(
                                    jqXHR, text, err,
                                    "$426Ticket.create (inner) error"
                                );
                            },
                            success: (data, text, jqXHR) => {

                                if (jqXHR["status"] === 201 || data == null) {
                                    $426_ajax_handle_error(
                                        jqXHR, text, data,
                                        "$426Ticket.create (inner) success"
                                    );
                                    func(-3);
                                } else {
                                    func(new $426Ticket(data));
                                }

                            },
                            type: "POST",
                            xhrFields: { withCredentials: true },
                        }
                    );

                }, this),
                $.proxy((response) => {
                    console.log(`Promise: ${response}`);
                    if (typeof(response) === "number") {
                        func(response);
                    } else {
                        func(new $426Ticket(response));
                    }
                }, this)
            );

        }, this),
        // $.then only picks up the first failure. It doesn't wait
        // to execute on failure.
        // This error handler is actually used!
        $.proxy((jqXHR, response, err) => {
            $426_ajax_handle_error(
                jqXHR, response, err,
                "$426Ticket.create error"
            );
            func(false);
        }, this)
    );

}
$426Ticket.retrieve_by_id = function(id) {
    return _db_retrieve_by_id(id, "tickets/");
}
$426Ticket.retrieve_by_itinerary_id = function(id, func) {

    if (typeof(id) !== "number") {
        return -1;
    } else if (!(func instanceof Function)) {
        return -2;
    }

    return $.ajax(
        `${$426_ROOT_URL}tickets?filter[itinerary_id]=${id}`,
        {
        
            context: this,
            datatype: "json",
            error: (jqXHR, text, err) => {
                $426_ajax_handle_error(
                    jqXHR, text, err,
                    "$426Ticket.retrieve_by_itinerary_id error"
                );
            },
            success: (data, text, jqXHR) => {

                if (jqXHR["status"] !== 200 || !Array.isArray(data)) {

                    $426_ajax_handle_error(
                        jqXHR, text, data,
                        "$426Ticket.retrieve_by_itinerary_id success"
                    );
                    func(-1);
                    return;

                } else if (data.length < 1) {

                    $426_ajax_handle_error(
                        jqXHR, text, data,
                        "$426Ticket.retrieve_by_itinerary_id success"
                    );
                    func(false);
                    return;

                }

                for (const tick of data) {
                    if (tick["itinerary_id"] === id) {
                        func(new $426Ticket(tick));
                    }
                }

            },
            type: "GET",
            xhrFields: { withCredentials: true },
        
        }
    );

}

$426_ajax_handle_error = function(jqXHR, text, err, where) {

    //alert("PANIC: AJAX Failure. See logs.")
    console.log(`AJAX Failure: ${where}`);
    console.log(jqXHR);
    console.log(text);
    console.log(err);

} 

$426_sanitize = function(s) {
    return s.replace(
        /</g, "&lt;"
    ).replace(
        />/g, "&gt;"
    ).replace(
        /'/g, "&#39;"
    ).replace(
        /"/g, "&quot;"
    ).replace(
        /&/g, "&amp;"
    );
}

/*
 * Status code check: return["status"] === 200
 * Critically, failure generally goes through error and not succees,
 * since the payload is by URI rather than JSON.
 */
var _db_retrieve_by_id = function(id, gate) {

    let t = typeof(id);
    if (t !== "number" && t !== "string") {
        return -1;
    } else if (typeof(gate) !== "string") {
        return -2;
    }

    return $.ajax(
        encodeURI(
            `${$426_ROOT_URL}${gate}${encodeURIComponent(id)}`
        ),
        {
            context: this,
            datatype: "json",
            error: (jqXHR, text, err) => {
                $426_ajax_handle_error(
                    jqXHR, text, err,
                    `_db_retrieve_by_id. Gate(${gate}), ID(${id})`
                )
            },
            type: "GET",
            xhrFields: { withCredentials: true },

        }
    );

}

// We can't create the $426Aiports object until we login, so that's
// simply a reference. This is the constructor. It is only used once
// and is called only by _db_login().
let _db_426Airports = function() {

    this.airports = {};
    this.airportsByCode = {};

    this.get_city = (id) => { return this.airports[id]["city"]; }
    this.get_code = (id) => { return this.airports[id]["code"]; }

    // This returns an array of strings, not integers, because of
    // the way Javascript handles keys.
    this.get_dests = (id) => { return Object.keys(this.airports[id]["info"]); }

    this.get_lat = (id) => { return +this.airports[id]["latitude"]; }
    this.get_long = (id) => { return +this.airports[id]["longitude"]; }
    this.get_name = (id) => { return this.airports[id]["name"]; }

    this.autocomplete = (txt) => {

        let out = [];
        txt = txt.toLowerCase()

        if (txt.length === 3) {

            let t = this.airportsByCode[txt];
            if (t !== undefined) {
                out.push(t)
            }

        } 

        for (const [key, value] of Object.entries(this.airports)) {

            if (
                value["code"].toLowerCase().startsWith(txt) 
                || value["name"].toLowerCase().startsWith(txt)
                || value["city"].toLowerCase().startsWith(txt)
            ) {
                out.push(this.airports[key]);
                if (out.length === 10) {
                    return out;
                }
            }

        }

        return out;

    }

    $.ajax(
        `${$426_ROOT_URL}airports`,
        {

            context : this,
            datatype : "json",
            error: (jqXHR, text, data) => {
                $426_ajax_handle_error(
                    jqXHR, text, error, "_db_426Airport error"
                );
            },
            success: (data, text, jqXHR) => {

                if (jqXHR["status"] !== 200) {
                    $426_ajax_handle_error(
                        jqXHR, text, data, "_db_426Airport success"
                    );
                }

                for (const item of data) {

                    item["info"] = JSON.parse(item["info"]);
                    this.airports[item["id"]] =  item;
                    this.airportsByCode[item["code"]] = item;
                }

                _db_on_airport_load();

                // We don't set $426Airports to this object.
                // Whatever calls us does that.

            },
            type: "GET",
            xhrFields: { withCredentials: true },

        }
    );

}

// Probably should be deleted before launch.
// Basically just used for testing.
let _db_on_airport_load = function(obj) {

    let a = $426Airports.get_dests(1611);
    a.push("1611");
    $426Map.add_airports(a);
    $426Map.add_paths(1611);

}


let db_login = function() {

    $.ajax(
        `${$426_ROOT_URL}sessions` ,
        {

            data: {
                user: {
                    username: "BabsonPrice",
                    password: "DaveRobert22"
                }
            },
            datatype: "json",
            error: (jqXHR, text, err) => {
                $426_ajax_handle_error(jqXHR, text, err);
            },
            success: (data, text, jqXHR) => {
                if (jqXHR.status === 204) {
                    $426Airports = new _db_426Airports();
                } else {
                    $426_ajax_handle_error(jqXHR, text, data);
                }
            },
            type: "POST",
            xhrFields: {withCredentials: true},

        }
    );

}();
