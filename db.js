// DB.JS //
//TODO REMEMBER TO CLEAN ALL USER INPUT.
//TODO USER INPUT MUST HAVE A MAX LENGTH.
//
// WARNING: Sanitation should occur the moment the input is
// collected. None of these objects and functions check for
// sanitation. It's assumed sanitation occurs long before strings
// get here. "Sanitation" as a concept also includes string length.
// These functions do not check for string length, even though some
// maximum length bound should always be instituted.
//
// Because of promises, code outside of the database interface will
// have to handle jqXHR status codes.
// Whenever this is the case, the function should say how to do
// this.
//
// Whenever an asynchronous request fails, the failure information
// may not be passed back to whatever function made the request.
// Generally just an error code is passed back, e.g. -1.
// The failure information is always logged though. Check the logs.
//
// This file is organized into 4 sections:
//  (1) Constants
//  (2) Global Objects
//  (3) Local References
//  (4) Helper Functions
// Organization within a section is alphabetic, except for prototype
// functions. Prototype functions must follow their object.
//
// Whenever "ID" is reference, it's referring to the database ID of
// references. Other uses of "ID", like airline code, airport code,
// or flight code, use some other terminology (like "code").


$426_ROOT_URL = "http://comp426.cs.unc.edu:3001/"


// This is a next level of silly, but the JS throws an error on load
// if you don't set it to *something*.
$426Airports = undefined;

/*
 *  Airline object
 *
 *  Parameters
 *  ----------
 *  oData   : Database data as a JavaScript object.
 *            oData is NOT a string.
 */
$426Airline = function(oData) {

    // Gets this airline's ID, an integer.
    this.get_id = () => { return oData["id"]; }
    // Gets this airline's logoURL, a string.
    // It's just a filename.
    this.get_logoURL = () => { return oData["logo_url"]; }
    // Return this airline's name, a string.
    this.get_name = () => { return oData["name"]; }

}
// see _db_retrieve_by_id()
$426Airline.retrieve_by_id = function(id) {
    return _db_retrieve_by_id(id, "airlines/");
}

/*
 *  Flight object
 *
 *  Parameters
 *  ----------
 *  oData   : Database data as a JavaScript object.
 *            oData is NOT a string.
 */
$426Flight = function(oData) {

    // Gets the airline ID of this flight, a number (integer).
    this.get_airline_id = () => { 
        let stored = oData["airline_id"];
        if (stored === 83) {
            return 82;
        } else {
            return stored;
        }
    }

    // Get the airport ID of the destination airport of this flight,
    // a number (integer).
    this.get_arrival_id = () => { return oData["arrival_id"]; }

    // Get the raw arrival time of this flight, a number.
    // See $426Flight.time_string_to_raw()
    this.get_arrival_time_raw = () => {
        return $426Flight.time_string_to_raw(oData["arrives_at"]);
    }

    /*
     *  Gets the arrival time of this flight.
     *
     *  Returns
     *  -------
     *  time: (String) Format of string returned is "00:00" in
     *        24Hour time. Timezone is the timezone of the
     *        source airport of this flight.
     */
    this.get_arrival_time_string = () => {
        return oData["arrives_at"].replace(/^2000-01-01T/, "").replace(/:00\.000Z$/, "");
    }

    // Get the airport ID of the source airport of this flight, a
    // number (integer).
    this.get_departure_id = () => { return oData["departure_id"]; }

    // Get the raw departure time of this flight, a number.
    // See $426Flight.time_string_to_raw()
    this.get_departure_time_raw = () => {
        return $426Flight.time_string_to_raw(oData["departs_at"]);
    }

    /*
     *  Gets the arrival time of this flight.
     *
     *  Returns
     *  -------
     *  time: (String) Format of string returned is "00:00" in
     *        24Hour time. Timezone is the timezone of the
     *        source airport of this flight.
     */
    this.get_departure_time_string = () => {
        return oData["departs_at"].replace(/^2000-01-01T/, "").replace(/:00\.000Z$/, "");
    }

    /*
     *  Gets the distance of this flight in kilometers. 
     *
     *  Returns
     *  -------
     *  distance: (Number - Integer) Distance of this flight in
     *            kilometers.
     *
     *  Notes
     *  -----
     *  Use .toLocaleString() on the return before putting it into
     *  HTML to use commas and such. (1,042 instead of 1042)
     */ 
    this.get_distance_km = () => {
        return +oData["info"];
    }

    /*
     *  Gets the distance of this flight in miles 
     *
     *  Returns
     *  -------
     *  distance: (Number - Integer) Distance of this flight in
     *            miles.
     *
     *  Notes
     *  -----
     *  Use .toLocaleString() on the return before putting it into
     *  HTML to use commas and such. (1,042 instead of 1042)
     */ 

    this.get_distance_m = () => {
        return Math.ceil((+oData["info"]) * 0.621371)
    }

    /*
     *  Gets the airline ID of the operator of this flight.
     * 
     *  Returns
     *  -------
     *  Operator    : (Number - Integer or null) Airline ID of the
     *                operator of this flight.
     *                If this flight does not have an operator, it is
     *                instead operated by the airline is it
     *                advertised under, this method returns null.
     *                This method returns null for all flights except
     *                those operated by Endeavor Air.
     */ 
    this.get_operator_id = () => {

        if (oData["airline_id"] === 83) {
            return 83;
        } else {
            return null;
        } 

    }

    // Gets the plane ID of the plane used on this flight. 
    this.get_plane_id = () => { return oData["plane_id"]; }

    /*
     *  Gets the flight number of this flight.
     *
     *  Returns 
     *  -------
     *  number  : (String) The flight number of this flight.
     *            Flight number have the general form
     *            "AIRLINE_CODE NUMBER", e.g. "AA 42".
     *            This leads to some nonsensical codes for small
     *            airlines who have numeric airline codes, but hey.
     */ 
    this.get_number = () => { return oData["number"]; }

}
/*
 *  Retrieves all flights coming from a source airport to a
 *  destination airport from the database.
 *
 *  Parameters
 *  ----------
 *  id_dest : (Number - Integer) Airport ID of destination airport.
 *  id_src  : (Number - Integer) Airport ID of source airport
 *  func    : (Function) Function which handles asynchronous
 *            returns.
 *
 *  Returns
 *  -------
 *  -1      : id_dest argument is not a number.
 *  -2      : id_src argument is not a number.
 *  -3      : func is not a function.
 *  false   : There are no flights between these two airports.
 *  true    : Flights between these airports exist. Asynchronous
 *            request sent.
 *
 *  Potential Arguments to func
 *  ---------------------------
 *  -1  : Asynchronous request failed
 *  obj : $426Flight object
 *
 *  Notes
 *  -----
 *  Only one argument will ever be passed to func at a time.
 */
$426Flight.retrieve_flights = function (id_dest, id_src, func) {

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
// See _db_retrieve_by_id()
$426Flight.retrieve_by_id = function(id) {
    return _db_retrieve_by_id(id, "flights/");
}
/*
 *  Converts a time in a string format to a raw number.
 *
 *  A "raw" time is in base of minutes, so an input of "15:15" will
 *  return 915. 
 *
 *  Parameters
 *  ----------
 *  time: (String) Time in the format "00:00", 24Hour time.
 *
 *  Returns
 *  -------
 *  raw : (Number - Integer) Raw value of given time.
 *  -1  : Argument time was not a string.
 *  -2  : Argument time was not formatted correctly.
 *
 *  Notes
 *  -----
 *  This function has not been tested since it was last changed.
 */
$426Flight.time_string_to_raw = function(time) {

    if (typeof(time) !== "string") {
        return -1;
    } else if (time.search(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/) < 0) {
        return -2;
    } else {
        let time = time.replace(/^2000-01-01T/, "").replace(/:00\.000Z$$/, "");
        return parseInt(time.replace(/:\d{2}$/, "")) * 60 + parseInt(time.replace(/^\d{2}:/, ""));
    }

}

/*
 *  Instance object
 *
 *  Instances represent a flight on any given date.
 *
 *  Parameters
 *  ----------
 *  oData   : Database data as a JavaScript object.
 *            oData is NOT a string.
 */
$426Instance = function(oData) {

    oData["info"] = JSON.parse(oData["info"]);
    if (oData["info"] === null) {
        oData["info"] = [];
    }

    /*
     *  Adds a reservation to this instance.
     *
     *  Parameters
     *  ----------
     *  seat    : (String) The seat reservation to add to this
     *            instance. Must be of the form "07B". Letters P-Z
     *            illegal. 
     *
     *  Returns
     *  -------
     *  -1      : Argument seat is not a string.
     *  -2      : Argument seat is not formatted correctly.
     *  false   : Seat could not be added because it has already
     *            been reserved.
     *  true    : Seat was added to this instance.
     *
     */ 
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

    // Gets the date of this instance, a string.
    // Dates are of the form "2020-11-31" 
    this.get_date = () => { return oData["date"]; }
    // Gets the flight ID of this instance, a number (integer).
    this.get_flight_id = () => { return oData["flight_id"]; }
    // Gets the ID of this instance, a number (integer). 
    this.get_id = () => { return oData["id"]; }
    
    /*
     *  Gets the seats reserved in this instance.
     *
     *  Returns
     *  -------
     *  seats   : (Array of Strings) Seats reserved in this instance.
     *
     */ 
    this.get_seats = () => { return oData["info"]; }

    /*
     *  Patch the database resource representing this instance.
     *
     *  One would want to do this if the instance already exists,
     *  but a new seat was successfully reserved. In that case the
     *  instance has changed, and the database must be updated to
     *  reflect that.
     *
     *  Returns
     *  -------
     *  jqXHR   : (jqXHR) Returns a jqXHR object of the asynchronous
     *            request.
     *
     *  Notes
     *  -----
     *  The caller of this method must check if the
     *  asynchronous request was successful, both in
     *  done and fail filters.
     *  If the call comes back into a fail filter, the
     *  call was not successful.
     *  If the call comes back into a done filter, the
     *  caller of this method must check the following:
     *  jqXHR["status"] === 200.
     *  See other examples of this practice in this file
     *  for further details
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
 * Creates a new Instance resource in the database.
 *
 *  If an instance aligning with the request already exists in the
 *  database, that is returned instead, and no new instance is
 *  created. This behavior is silent.
 *
 *  Parameters
 *  ----------
 *  date    : (String) A string representing the date of the new
 *            instance. Must be formatted as "2018-11-31"
 *  idFlight: (Number - Integer) ID of the flight associated with
 *             the new instance. 
 *  seat    : (String) Seat to be reserved. A new instance cannot be
 *            created unless one seat has been reserved.
 *  func    : (Function) Function to handle asynchronous returns. 
 *
 *  Returns
 *  -------
 *  -1      : date is not a string.
 *  -2      : idFlight is not a number
 *  -3      : seat is not a string.
 *  -4      : func is not a function.
 *  -5      : date is not formatted correctly.
 *  -6      : date is in the past or date is an impossible date,
 *            e.g. "2018-50-50".
 *  -7      : idFlight is not within the range of flight IDs of
 *            our database, and therefore must be illegal.
 *  -8      : seat is not formatted correctly. The formatting of a seat
 *            is "07B". Letters P-Z are illegal.
 *  jqXHR   : jqXHR object. Caller does not need to wait on object.
 *            Argument func will handle asynchronous returns.
 *            This return indicates the call to this function was
 *            successful as far as the caller should be concerned.
 *
 * Potential Arguments to func
 * ---------------------------
 *  -1  : Asynchronous request failed
 *  obj : $426Instance object.
 *
 *  Notes
 *  -----
 *  Only one argument will ever be passed to func at a time.
 *
 */
//FIXME February 31st is "legal" currently. More checks are necessary.
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
// Helper function. Don't call this function.
// You want to be calling this guy's parent,
// $426Instance.create().
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
// See _db_retrieve_by_id()
$426Instance.retrieve_by_id = function(id) {
    return _db_retrieve_by_id(id, "instances/");
}
/*
 *  Retrieves an Instance by date and flight ID.
 *
 *  Date can be null, so it also can retrieve Instances by flight
 *  ID alone.
 *
 *  Parameters
 *  ----------
 *  date    : (String) Date associated with the Instance to be
 *            retrieved.
 *            date can be null or "". These are valid parameters
 *            and will not result in an error code.
 *            The call will just filter on idFlight alone.
 *  idFlight: (Number - Integer) Flight ID associated with the
 *            Instance to be retrieved.
 *  func    : (Function) Function which handles asynchronous
 *            returns.
 *
 *  Returns
 *  -------
 *  -1      : idFlight is not a number.
 *  -2      : func is not a function.
 *  jqXHR   : jqXHR object. Caller does not need to wait on object.
 *            Argument func will handle asynchronous returns.
 *            This return indicates the call to this function was
 *            successful as far as the caller should be concerned.

 *
 *  Potential Arguments to func
 *  ---------------------------
 *  -1      : Asynchronous request failed
 *  false   : Asynchronous request succeeded, but there were no
 *            Instances associated with the parameters given.
 *  obj     : $426Instance object
 *
 *  Notes
 *  -----
 *  Only one argument will ever be passed to func at a time.
 *
 *  The asynchronous request can return multiple instances,
 *  particularly if date is null or invalid. The caller and func
 *  should be prepared for this outcome.
 */
$426Instance.retrieve_by_flight_id_and_date = function(idFlight, date, func) {

    if (typeof(idFlight) !== "number") {
        return -1;
    } else if (!(func instanceof Function)) {
        return -2;
    }

    if (date == null || typeof(date) !== "string" || date === "") {

        return $.ajax(
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

        return $.ajax(
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

}

/*
 *  Itinerary object
 *
 *  Parameters
 *  ----------
 *  oData   : Database data as a JavaScript object.
 *            oData is NOT a string.
 */
$426Itinerary = function(oData) {

    // Gets the confirmation code of this itinerary, a string.
    this.get_code = () => { return oData["confirmation_code"]; }
    // Gets the email address of this itinerary, a string. 
    this.get_email = () => { return oData["email"]; }
    // Gets the ID of this itinerary, and number (integer).
    this.get_id = () => { return oData["id"]; }

}
/*
 * Creates a new Itinerary resource in the database.
 *
 *  If an instance aligning with the request already exists in the
 *  database, that is returned instead, and no new instance is
 *  created. This behavior is silent.
 *
 *  Parameters
 *  ----------
 *  code    : (String) The confirmation code for the new itinerary.
 *            The code must be 10 alphanumeric characters.
 *            See $426Itinerary.generate_code().
 *  email   : (String) The email associated with the new itinerary.
 *  func    : (Function) Function to handle asynchronous returns. 
 *
 *  Returns
 *  -------
 *  -1      : code is not a string.
 *  -2      : email is not a number
 *  -3      : func is not a function.
 *  -4      : code is illegal (not alphanumeric, etc).
 *  -5      : Invalid email address formatting.
 *  jqXHR   : jqXHR object, an jqXHR not actually associated with
 *            asynchronous POST request.
 *            This return is for testing purposes and should NOT be
 *            manipulated by any normal calling function.
 *            This return indicates the call to this function was
 *            successful as far as the caller should be concerned.
 *
 * Potential Arguments to func
 * ---------------------------
 *  -1      : Something is seriously wrong with this function and needs
 *            debugging. This should NEVER be passed on to func.
 *  -2      : Something is seriously wrong with this function and needs
 *            debugging. This should NEVER be passed on to func.
 *  -3      : Something is seriously wrong with this function and needs
 *            debugging. This should NEVER be passed on to func.
 *  -4      : Asynchronous request failed.
 *  false   : Itinerary with the provided code already exists in the
 *            database. No new itinerary was created.
 *  obj     : $426Itinerary object
 *
 *  Notes
 *  -----
 *  Only one argument will ever be passed to func at a time.
 *
 *  Check the uniqueness of the code before passing it to this
 *  function. Not required, this function handles non-unique codes,
 *  but that will probably make life easier.
 */
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
    } else if (code.search(/^[\dA-Z]{10}$/) < 0) {
        return -4; 
    } else if (
        email.search(
            /^[a-zA-Z0-9!#$%&'*+\-/=?^_`{|}~.]+@[a-zA-Z0-9.]+\.[a-zA-Z0-9]+$/
        ) < 0
    ) {
        return -5;
    }

    return $426Itinerary.retrieve_by_code(code, (r) => {

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
                            func(-4);
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
/*
 *  Returns a 10 character string of random alphanumeric characters.
 *
 *  This function is designed to create random codes for new
 *  itineraries.
 *
 *  Returns
 *  -------
 *  code    : (String) A 10 character string of random alphanumeric
 *            characters. All alphabetic characters will be
 *            uppercase.
 *
 *  Notes
 *  -----
 *  This function makes no guarantee of the uniqueness of the code
 *  generated.
 */
$426Itinerary.generate_code = function() {

    let legal = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let out = "";

    for (let i = 0; i < 10; ++i) {
        out += legal[Math.floor(Math.random() * 36)];
    }

    return out;

}
/*
 *  Retrieves an itinerary by confirmation code.
 *
 *  Parameters
 *  ----------
 *  code    : (String) The confirmation code associated with the
 *            desired itinerary. Must be composed of 10 alphanumeric
 *            characters.
 *  func    : (Function) Function which handles asynchronous
 *            returns.
 *  
 *  Returns
 *  -------
 *  -1  : code is not a string.
 *  -2  : func is not a function.
 *  -3  : code does not have the format of a confirmation code. 
 *
 *  Potential Arguments to func
 *  ---------------------------
 *  -1      : Asynchronous request failed
 *  false   : Asynchronous request succeeded, 
 *            but no Instances are associated with the code given.
 *  obj     : $426Itinerary object
 *
 *  Notes
 *  -----
 *  Only one argument will ever be passed to func at a time.
 */
$426Itinerary.retrieve_by_code = function(code, func) {

    if (typeof(code) !== "string" ) {
        return -1;
    } else if (!(func instanceof Function)) {
        return -2;
    } else if (code.search(/^[\dA-Z]{10}$/) < 0) {
        return -3;
    }

    return $.ajax(
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

} 
/*
 *  Retrieves itineraries by email address.
 *
 *  Parameters
 *  ----------
 *  email   : (String) The email address associated with the
 *            itineraries desired.
 *  func    : (Function) Function which handles asynchronous
 *            returns.
 *  
 *  Returns
 *  -------
 *  -1  : code is not a string.
 *  -2  : func is not a function.
 *
 *  Potential Arguments to func
 *  ---------------------------
 *  -1      : Asynchronous request failed
 *  false   : Asynchronous request succeeded, 
 *            but there are no Instances associated with email
 *            address given.
 *  obj     : $426Itinerary object
 *
 *  Notes
 *  -----
 *  Only one argument will ever be passed to func at a time.
 *
 *  Often there will be more than one itinerary returned. func will
 *  be fired for as many itineraries as are found. Arrays are not
 *  passed to func, itineraries are.
 */

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
                    func(false);
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
// See _db_retrieve_by_id().
$426Itinerary.retrieve_by_id = function(id) {
    return _db_retrieve_by_id(id, "itineraries/");
}

/*
 *  Plane object
 *
 *  Parameters
 *  ----------
 *  oData   : Database data as a JavaScript object.
 *            oData is NOT a string.
 */
$426Plane = function(oData) {

    oData["info"] = JSON.parse(oData["info"]);

    // Gets the name of the plane, a string.
    this.get_name = () => { return oData["name"]; }
    // Gets the number of rows in the plane, a number (integer).
    this.get_rows = () => { return +oData["info"]["rows"]; }

    /*
     *  Gets the seat scheme of the plane. 
     *
     *  Returns
     *  -------
     *  scheme  : (String) Seat scheme of the plane.
     *            A seat scheme is a set of numbers divided by "|".
     *            The 3-3 seat scheme in an Airbus A320 is
     *            represented by "3|3".
     *            The 2-3-2 seat scheme in an Boeing 767 is
     *            represented by "2|3|2".
     *
     *  Notes
     *  -----
     *  There are no cabins in any scheme. Planes are one cabin,
     *  with the same seating alignment in every row. 
     *  Airlines do not have unique seating schemes. Every A320 for
     *  every airline has the same seating schemes. Planes are not
     *  unique to airlines.
     */ 
    this.get_scheme = () => { return oData["info"]["scheme"]; }

}
// See _db_retrieve_by_id().
$426Plane.retrieve_by_id = function(id) {
    return _db_retrieve_by_id(id, "planes/");
}

/*
 *  Ticket object
 *
 *  Parameters
 *  ----------
 *  oData   : Database data as a JavaScript object.
 *            oData is NOT a string.
 */
$426Ticket = function(oData) {

    // Gets the age of the ticket holder, a number (integer).
    this.get_age = () => { return oData["age"]; }
    // Gets the gender of the ticket holder, a string.
    this.get_gender = () => { return oData["gender"]; }
    // Gets the ID of the instance associated with the ticket
    // holder, a number (integer).
    this.get_idInstance = () => { return oData["instance_id"]; }
    // Gets the ID of the itinerary associated with this ticket
    // holder, a number (integer).
    this.get_idItinerary = () => { return oData["itinerary_id"]; }
    // Gets the first name of this ticket holder, a string, which
    // includes the ticket holder's salutations (Mr. Ms. Dr., etc.).
    this.get_nameFirst = () => { return oData["first_name"]; }
    // Gets the last name of this ticket holder, a string, which
    // includes the ticket holder's suffix (III, IV, Jr., etc.).
    this.get_nameLast = () => { return oData["last_name"]; }
    // Gets the middle name of this ticket holder, a string.
    this.get_nameMiddle = () => { return oData["middle_name"]; }
    
    /*
     *  Gets the price of this ticket.
     *
     *  Returns
     *  -------
     *  false   : Price was not given on creation.
     *  price   : (Number - Float) Price paid for ticket.
     */ 
    this.get_price = () => {
        let price = oData["price_pad"];
        if (price ==  null || price < 0) {
            return false;
        } else {
            return price;
        }
    }

    // Gets the seat reserved for this ticket holder, a string.
    // e.g. "04B".
    this.get_seat = () => { return oData["info"]; }

}
// Helper function. Don't call this function.
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
/*
 *  Creates a new Ticket resource in the database.
 *
 *  If at ticket exists in the database and has every single one of
 *  these parameters, nothing is different, the function silently
 *  does not create the new ticket. It instead returns the existing ticket. 
 *
 *  Parameters
 *  ----------
 *  Age         : (Number - Integer) Age of the new ticket holder.
 *  Gender      : (String) Gender of the new ticket holder.
 *                Any non-empty string is a valid gender.
 *  idInstance  : (Number - Integer) ID of the flight instance
 *                associated with the new ticket.
 *  idItinerary : (Number - Integer) ID of the instance associated
 *                with the new ticket.
 *  nameFirst   : (String) First name of the new ticket holder.
 *                Any nonempty string is a valid nameFirst.
 *  nameMiddle  : (string) Middle name of the new ticket holder.
 *                Empty string is valid
 *  nameLast    : (String) Last name of the new ticket holder.
 *                Empty string is valid.
 *  nameSal     : (String) Salutations of the new ticket holder.
 *                This is meant to be Mr., Mrs., Dr., etc., but no
 *                check is made. It can be anything in practice,
 *                including the empty string.
 *  nameSuffix  : (String) Suffix of the new ticket holder.
 *                This is meant to be Jr., III, IV, etc., but no
 *                check is made. It can be anything in pratice,
 *                including the empty string.
 *  price       : (Number - Float) Price paid for the ticket.
 *                To indicate null, provide a negative number.
 *  seat        : (String) Seat reserved for the new ticket.
 *                Seat must be the format of a seat. "04B".
 *  func        : (Function) Function which handles asynchronous
 *                returns.
 *
 *  Returns
 *  -------
 *  -1      : age is not a number.
 *  -2      : gender is not a string or is the empty string.
 *  -3      : idInstance is not a number.
 *  -4      : idItinerary is not a number.
 *  -5      : nameFirst is not a string or is the empty string.
 *  -6      : nameMiddle is not a string.
 *  -7      : nameLast is not a string.
 *  -8      : nameSal is not a string.
 *  -9      : nameSuffix is not a string.
 *  -10     : price is not a number.
 *  -11     : seat is not a string.
 *  -12     : func is not a function.
 *  -13     : seat is improperly formatting for a seat.
 *            Seats are of the form "ROWLETTER", e.g."04B".
 *            Letters below O are illegal.
 *  promise : promise object. Caller should not wait on this
 *            object, as it is meant for debugging only. Argument
 *            func will handle asynchronous returns.
 *            This return indicates the call to this function was
 *            successful as far as the caller should be concerned.
 *
 * Potential Arguments to func
 * ---------------------------
 *  -1  : Something is seriously wrong with this function and needs
 *        debugging. This should NEVER be passed on to func. 
 *        Problem is with idInstance.
 *  -2  : Something is seriously wrong with this function and needs
 *        debugging. This should NEVER be passed on to func. 
 *        Problem is with idItinerary.
 *  -3  : Asynchronous PUT request failed.
 *  -4  : Asynchronous GET request failed.
 *  -5  : Asynchronous GET request failed.
 *  -6  : Asynchronous GET request failed.
 *  obj : $426Instance object.
 *
 *  Notes
 *  -----
 *  Only one argument will ever be passed to func at a time.
 *
 */
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
    price,
    seat,
    func,
) {

    if (typeof(age) !== "number") {
        return -1;
    } else if (typeof(gender) !== "string" || gender === "") {
        return -2;
    } else if (typeof(idInstance) !== "number") {
        return -3;
    } else if (typeof(idItinerary) !== "number") {
        return -4;
    } else if (typeof(nameFirst) !== "string" || nameFirst === "") {
        return -5;
    } else if (typeof(nameMiddle) !== "string") {
        return -6;
    } else if (typeof(nameLast) !== "string") {
        return -7;
    } else if (typeof(nameSal) !== "string") {
        return -8;
    } else if (typeof(nameSuffix) !== "string") {
        return -9;
    } else if (typeof(price) !== "number") {
        return -10;
    } else if (typeof(seat) !== "string") {
        return -11;
    } else if (!(func instanceof Function)) {
        return -12;
    } else if (seat.match(/^\d{1,2}[A-O]$/) === null) {
        return -13;
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
                    //console.log(`Promise: ${response}`);
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

/*
 *  Create a random ticket price based off of a flight.
 *
 *  Parameters
 *  ----------
 *  flight  : ($426Flight Object) Flight to get price of.
 *
 *  Returns
 *  -------
 *  price   : (Number - Float) Price of this flight.
 */
$426Ticket.make_price = function(flight) {

    let r = Math.random();
    // 1000 / 200 * 0.621371 * 100 = 12.42742
    if (r > 0.5) {
        return flight.get_distance_km() * r * 12.42742;
    } else {
        return flight.get_distance_km() * r * 24.85484;
    }

}
// See _db_retrieve_by_id
$426Ticket.retrieve_by_id = function(id) {
    return _db_retrieve_by_id(id, "tickets/");
}
/*
 *  Retrieves tickets associated with an itinerary ID.
 *
 *  Parameters
 *  ----------
 *  id      : (Number - Integer) ID of the itinerary associated
 *            with the tickets desired.
 *  func    : (Function) Function which handles asynchronous
 *            returns.
 *
 *  Returns
 *  -------
 *  -1      : id is not a number
 *  -2      : func is not a function.
 *  jqXHR   : jqXHR object. Caller does not need to wait on object.
 *            Argument func will handle asynchronous returns.
 *            This return indicates the call to this function was
 *            successful as far as the caller should be concerned.
 *
 *  Potential Arguments to func
 *  ---------------------------
 *  -1      : Asynchronous request failed
 *  false   : Asynchronous request succeeded, but there were no
 *            Tickets associated with the itinerary ID given.
 *  obj     : $426Ticket object.
 *
 *  Notes
 *  -----
 *  Only one argument will ever be passed to func at a time.
 *
 *  func should expect to be fired multiple times for every ticket
 *  found. However only one $426Ticket object is passed to func. An
 *  array is not passed to func, but the caller and func should be
 *  prepared to be fired in rapid succession.
 */
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

                    // This "error" occurs during healthy use.
                    // It's nice for development though.
                    //$426_ajax_handle_error(
                    //    jqXHR, text, data,
                    //    "$426Ticket.retrieve_by_itinerary_id success"
                    //);
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


/*
 *  Regular printout of AJAX errors
 *
 *  Whenever there is an AJAX error, successes included, this
 *  function should be called to log the error to the console in a
 *  regular manner
 *
 *  Parameters
 *  ----------
 *  jqXHR   : (jqXHR) jqXHR object returned by the AJAX call.
 *  text    : (String) Text status returned by the AJAX call.
 *  err     : (String) Error thrown by the AJAX call.
 *  where   : (String) In what function was the offending AJAX
 *            call? So the source of the problem can be found to be
 *            debugged.
 *
 *  Notes
 *  -----
 *  See the error subsection of http://api.jquery.com/jquery.ajax/
 *  for a better understand of the parameters that should be passed
 *  to this function
 */
$426_ajax_handle_error = function(jqXHR, text, err, where) {

    //alert("PANIC: AJAX Failure. See logs.")
    console.log(`AJAX Failure: ${where}`);
    console.log(jqXHR);
    console.log(text);
    console.log(err);

} 

/*
 *  Sanitizes a string of special HTML characters
 *
 *  This is NOT a replacement for encodeURI() or encodeURIComponent(),
 *  nor does this check the length of the string.
 *
 *  Parameters
 *  ---------
 *  s   : (String) String to be sanitized.
 *
 *  Returns
 *  -------
 *  s   : (String) Sanitized string.
 *
 *  Notes
 *  -----
 *  This function can and should be used everywhere, not just in the
 *  DB interface.
 */
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


// Login in function. Do not call this function.
let db_login = function() {

    $.ajax(
        `${$426_ROOT_URL}sessions`,
        {

            data: {
                "user": $426Parameters
            },
            datatype: "json",
            error: (jqXHR, text, err) => {
                $426_ajax_handle_error(jqXHR, text, err);
            },
            success: (data, text, jqXHR) => {
                if (jqXHR.status === 204) {
                    new _db_426Airports();
                } else {
                    $426_ajax_handle_error(jqXHR, text, data);
                }
            },
            type: "POST",
            xhrFields: {withCredentials: true},

        }
    );

}


// We can't create the $426Aiports object until we login, so that's
// simply a reference. This is the constructor. It is only used once
// and is called only by _db_login().
// Do not create this object.
// TODO Comment this!
let _db_426Airports = function() {

    this.ILLEGAL_AIRPORT_IDS = [
        1479, 1496, 1528, 1534, 1549, 1567, 1594, 1669, 1520, 1556,
        1580, 1613, 1643, 1664, 1527, 1530, 1542, 1551, 1605, 1608,
        1620, 1644, 1693, 1717, 1768, 1751, 1766, 1814, 1823, 1752,
        1827, 1872, 1897, 1899, 1902, 1912, 1918, 1921, 1948, 1959
    ];

    this.airports = {};
    this.airportsByCode = {};

    this.get_city = (id) => { return this.airports[id]["city"]; }
    this.get_code = (id) => { return this.airports[id]["code"]; }

    /*
     *  Returns an array of STRINGS representing airport IDs.
     *
     *  ident can be null.
     *
     *  Parameters
     *  ----------
     *  ident   : (Number - Integer) Airport ID of source airport.
     *            If this is provided, then the IDs of the
     *            destinations from that airport will be returned.
     *            Otherwise, the IDS of all airports will be
     *            returned.
     *
     *  Returns
     *  -------
     *  ids : (Array - Strings) An array of strings representing
     *        airport IDs.
     */
    this.get_dests = (ident) => {

        if (typeof(ident) === "number") {

            if ($426Airports.is_airport_id(ident)) {

                return Object.keys(this.airports[ident]["info"]);

            } else {

                return false;

            }

        } else {

            return Object.keys(this.airports);

        }

    }

    this.get_lat = (id) => { return +this.airports[id]["latitude"]; }
    this.get_long = (id) => { return +this.airports[id]["longitude"]; }
    this.get_name = (id) => { return this.airports[id]["name"]; }

    this.autocomplete = (txt) => {

        const NUM_RETURNS = 9;

        let out = [];
        txt = txt.toLowerCase()

        if (txt.length === 3) {

            let t = this.airportsByCode[txt];
            if (t !== undefined) {
                out.push(t["id"])
            }

        }

        for (const [key, value] of Object.entries(this.airports)) {

            if (
                value["code"].toLowerCase().startsWith(txt) 
                || value["name"].toLowerCase().startsWith(txt)
                || value["city"].toLowerCase().startsWith(txt)
            ) {
                out.push(key);
                if (out.length === NUM_RETURNS) {
                    return out;
                }
            }

        }

        return out;

    }

    /*
     *  Checks whether or not a provided airport ID is valid. 
     *
     *  Parameters
     *  ----------
     *  ident   : (Number - Integer) airport ID to check.
     *
     *  Returns
     *  -------
     *  false   : ident is not a valid airport ID.
     *  true    : ident is a valid airport ID.
     *
     */ 
    this.is_airport_id = (ident) => {

        if (typeof(ident) !== "number") {

            return false;

        } else if (ident > 1982 || ident < 1465) {

            return false;

        } else if (this.ILLEGAL_AIRPORT_IDS.includes(ident)) {

            return false;

        } else {

            return true;

        }

    }

    $.ajax(
        `${$426_ROOT_URL}airports`,
        {

            context : this,
            datatype : "json",
            error: (jqXHR, text, err) => {
                $426_ajax_handle_error(
                    jqXHR, text, err, "_db_426Airport error"
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

                $426Airports = this;

                _db_on_airport_load();

            },
            type: "GET",
            xhrFields: { withCredentials: true },

        }
    );

}

// Probably should be deleted before launch.
// Basically just used for testing.
let _db_on_airport_load = function(obj) {
        return;
    if ($426Map.get_map() == null) {
        setTimeout(_db_on_airport_load, 500);
    }
    $426Map.set_airports($426Airports.get_dests(1611));
    $426Map.draw_airports($426Map.get_airports())
    $426Map.draw_airportSource(1611);
    $426Map.draw_paths();

}

/*
 *  Retrieves a resource from the database by ID.
 *
 *  Parameters
 *  ----------
 *  id  : (Number - Integer OR String) ID of the resource to
 *        retrieve.
 *  gate: (String) Resources gate to retrieve, e.g. "airports/"
 *        gate must always end with a "/".
 *
 *  Returns
 *  -------
 *  jqXHR   : jqXHR object. This object should be waited on by the
 *            caller of this function to check its status.
 *
 *  Notes
 *  -----
 *  $.wait().then() paradigm should be used with this function call.
 *  Both done and failure gates of .then() must be checked.
 *  Critically, since this request is done by URI rather than
 *  payload, failure generally come through the failure gate and not
 *  the done gate. This is unique of AJAX requests in this
 *  interface.
 *  In the done gate, jqXHR["status"] === 200 should be checked to
 *  confirm the request was indeed successful.
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
