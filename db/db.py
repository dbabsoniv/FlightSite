#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Written for Python 3.5.3

REFERENCE db_write.py NOT ME, IF YOU HAVE A CHOICE.
 
Program to clean airports and route data and add it to database
via the API for Fall 2018 COMP 426 final project.

This file was mostly getting the original datasets in order and
building a base of 20,000 flights to upload to the API.
The proved too much for the API, so db_write.py was established
to implement the strategy of putting JSON in every airport.
This build method is still good though, and should be used as
a model when implementing the JavaScript build method.
Also Haversign and all that jazz.

Author
------
Robert E. Price, III

Written
-------
17-18 November 2018

"""

import csv
import io
import json
import math
import random
import time
import sys

import requests 

"""

ALL RANGES INCLUSIVE
General API gateways for getting groups of information do not work
over ~110 entries.
Basically be safe never use that gateway for airports and flights.

AIRLINE ID RANGE: [17, 58]
AIRPORT ID RANGE: [940, 1457]
FLIGHT ID RANGE
PLANE ID RANGE: [5, 55]

FLIGHT INFO SCHEME ON DB:
Flight info stores subsidiary information and milage. Subsidiary only showed up for
one airline, Endeavor, which is Delta's subsidiary. Thus, whenever
a Delta flight is operated by Endeavor, Endeavor's ID will be stored
in the flight's info field. (The DB ID, NOT the airline's code.)
"34" may show up in info for some Delta flights (33), and the
Javascript will have to note that Endeavor is operating the flight
accordingly.
Milage (kilometers) will show up for all flights. Thus, these two schemes may be
common:
"3113,34"
"121,"
"3132,"

PLANE INFO SCHEME ON DB:
"|" are aisle.
ROWS,SEAT_WITHIN_ROW_SCHEME
Thus "44,2|7|2" has 44 rows which all have 11 seats and two aisles. 2
seats to the outside of each aisle, and 7 seats between teh aisles.
This scheme purposefully does not allow for first class unique
seating.

"""


API = "http://comp426.cs.unc.edu:3001/"
AIRLINES = []
AIRPORTS = []
AIRPORT_IDS = []
AIRPORTS_USED = []
CODES = []
IATA3 = {}
ICAO4 = {}
PLANES = []
PLANES_DICT= {}
RADIUS_EARTH = 6371 # Kilometers
ROUTES = []
SESSION = requests.Session()
SUBS = {"9E": "DL"}
USER = ""
PW = "" 

AIRLINES_BAD = (
    "2O", "3E", "3F", "3H", "4E", "4N", "4W", "4Y", "6L", "8D", "8P",
    "BA", "BH", "CI", "CX", "GV", "HW", "I4", "J3", "J5", "JB",
    "JJ", "K3", "K5", "KE", "KO", "LW", "NH", "OR", "OZ", "P1",
    "P6", "PR", "Q5", "Q9", "QF", "QR", "RJ", "TJ", "WP", "WT",
    "VX", "X7", "YR", "Z3", 
)

AIRLINES_KNOWN = (
    # Large airlines that should be included.
    "9E", "AA", "AC", "AS", "B6", "DL", "F9", "FL", "G4", "HA",
    "NK", "UA", "US", "VX", "WN", "WS",

    # These guys could probably be ignored and no one would notice.
    "3M", "4B", "4B", "4K", "5T", "7F", "7H", "7S", "8E",
    "8T", "8V", "9K", "9M", "JV", "KS", "M5", "MO", "MW", "PB",
    "PD", "SY", "TS", "WJ", "YN", "ZK"
)


def main(args):

    #write_rep_routes_build()
 
    db_write_flights()
    write_routes_id()

    #db_write_airports()


class Airline(object):

    def __init__(self, ID, name, code, logoType):

        self.code = code
        self.id = int(ID)
        self.logoType = logoType
        self.name = name

    def __iter__(self):
        return iter([self.id, self.name, self.code, self.logoType])

    def p(self):
        print(list(self))

    def set_id(self, ID):
        self.id = int(ID)

class Airport(object):

    def __init__(
        self, ID, city, country, IATA3, ICAO4, lat, lng, OF, name, state
    ):
    
        self.city = None if (city == "\\N") else city
        self.country = None if (country == "\\N") else country
        self.IATA3 = None if (IATA3 == "\\N") else IATA3
        self.ICAO4 = None if (ICAO4 == "\\N") else ICAO4
        self.lat = None if (lat == "\\N") else lat
        self.lng = None if (lng == "\\N") else lng
        self.OF = None if (OF == "\\N") else OF
        self.name = None if (name == "\\N") else name
        self.state = None if (state == "\\N") else state
        self.id = None if (ID == "\\N") else ID

        if self.id != "":
            self.id = int(self.id)

    def __iter__(self):
        return iter(
            [self.id, self.city, self.country, self.IATA3, self.ICAO4, self.lat,
            self.lng, self.OF, self.name, self.state]
        )

    def p(self):
        print(list(self))

    def set_id(self, ID):
        self.id = int(ID)

class Plane(object):

    def __init__(self, ID, code, name, rows, scheme):

        self.code = code
        self.id = None if (ID == "") else int(ID)
        self.name = name
        self.rows = rows
        self.scheme = scheme

    def __iter__(self):
        return iter(
            [self.id, self.code, self.name, self.rows, self.scheme]
        )

    def p(self):
        print(list(self))

    def set_id(self, ID):
        self.id = int(ID)

class Route(object):

    def __init__(
        self, ID, airline, airlineID, airlineOF, arr, dept, dest,
        destID, destOF, dist, dur, num, operator,
        plane, planeID, src, srcID, srcOF
    ):

        self.airline = None if (airline == "\\N") else airline
        self.airlineOF = None if (airlineOF == "\\N") else airlineOF
        self.dest = None if (dest == "\\N") else dest
        self.destOF = None if (destOF == "\\N") else destOF
        self.plane = None if (plane == "\\N") else plane
        self.src = None if (src == "\\N") else src
        self.srcOF = None if (srcOF == "\\N") else srcOF

        self.airlineID = airlineID
        self.arr = arr
        self.dept = dept
        self.destID = destID
        self.dist = dist
        self.dur = dur
        self.id = ID
        self.num = num
        self.operator = operator
        self.planeID = planeID
        self.planeUsed = plane.split(" ")[0]
        self.srcID = srcID

        if self.airlineOF == "":
            self.airlineOF = None
        if self.destOF == "":
            self.destOF = None
        if self.operator == "":
            self.operator = None
        if self.srcOF == "":
            self.srcOF = None

        if self.airlineID != "" and self.airlineID is not None:
            self.airlineID = int(self.airlineID)
        if self.arr != "" and self.arr is not None:
            self.arr = int(self.arr)
        if self.dept != "" and self.dept is not None:
            self.dept = int(self.dept)
        if self.dist != "" and self.dist is not None:
            self.dist = int(self.dist)
        if self.id != "" and self.id is not None:
            self.id = int(self.id)
        if self.num != "" and self.num is not None:
            self.num = int(self.num)
        if self.planeID != "" and self.planeID is not None:
            self.planeID = int(self.planeID)
        if self.srcID != "" and self.srcID is not None:
            self.srcID = int(self.srcID)

        if self.airline == "9E":
            self.airline = "DL"
            self.operator = "9E"

    def __iter__(self):
        return iter([
            self.id, self.airline, self.airlineID, self.airlineOF,
            self.arr, self.dept, self.dest, self.destID,
            self.destOF, self.dist, self.dur, self.num,
            self.operator, self.plane,
            self.planeID, self.src, self.srcID, self.srcOF 
        ])

    # Returns great circle distance between two Lat/Long pairs.
    def _haversign(self, lat1, lng1, lat2, lng2):

        dLat = self._deg_to_rad(lat2-lat1); 
        dlng = self._deg_to_rad(lng2-lng1); 
        t = (
            math.sin(dLat / 2) * math.sin(dLat / 2) +
            math.cos(self._deg_to_rad(lat1)) * math.cos(self._deg_to_rad(lat2)) * 
            math.sin(dlng / 2) * math.sin(dlng / 2)
        ) 
        # Radius of Earth * 2 = 12742
        return 12742.0 * math.atan2(math.sqrt(t), math.sqrt(1-t)); 

    def _deg_to_rad(self, deg):
        return deg * math.pi / 180.0

    def create(self, num, dup):

        self.num = int(num)
        self.dept = random.randint(360, 1440 - self.dur)
        self.arr = self.dept + self.dur

        if (dup):
            routeCompliment = Route(
                None, self.airline, self.airlineID,
                self.airlineOF, None, None, self.src,
                self.srcID, self.srcOF, self.dist, self.dur,
                None, self.operator, self.plane, self.planeID,
                self.dest, self.destID, self.destOF
            )
            routeCompliment.create(num + 1, False)
            return routeCompliment

        return None
 
    def num_as_string(self):
        return "{} {}".format(
            self.airline, self.num
        )

    def p(self):
        print(list(self))

    def time_to_string(self, time):

        # 60 * 24 = 1440
        if time < 0:
            return "00:00"
        elif time > 1440:
            return "23:59"
        else:
            return "{:0>2d}:{:0>2d}".format(
                int(time / 60), int(time % 60)
            )

    def set_dist(self, lat1, lng1, lat2, lng2):
        self.dist = int(self._haversign(lat1, lng1, lat2, lng2))
        self.dur = int((self.dist / 900.0) * 60.0) + 21

    def set_airlineID(self, airlineID):
        self.airlineID = int(airlineID)
    def set_arr(self, arr):
        self.arr = int(arr)
    def set_dept(self, dept):
        self.dept = int(dept)
    def set_destID(self, destID):
        self.destID = int(destID)
    def set_id(self, ID):
        self.id = int(ID)
    def set_num(self, num):
        self.num = int(num)
    def set_planeID(self, planeID):
        self.planeID = int(planeID)
    def set_srcID(self, srcID):
        self.srcID = srcID


def patch_airports():

    return 

    read_airports()
    read_routes_build()
    outgoing = {}
    path = {}

    for route in ROUTES:

        s = "{},{}".format(route.srcID, route.destID)
        try:
            path[s].append(route.id)
        except KeyError:
            path[s] = [route.id]

        try:
            if route.destID not in outgoing[route.srcID]:
                outgoing[route.srcID].append(route.destID)
            else:
                continue
        except KeyError:
            outgoing[route.srcID] = [route.destID]


def db_patch_airports():

    pass

def db_read_airports():

    login()
    data = []

    for ident in range(940, 940 + 130):
        r = SESSION.get(
            API + "airports/{}".format(ident)
        )
        data.append(r.json())

    i = 0
    for d in data:
        i += 1
    print(i)

    r = SESSION.get(
        API + "airports"
    )
    j = 0
    for d in r.json():
        j += 1
    print(j)
        

        
def db_write_airlines():

    return

    login()
    read_airlines()

    for airline in AIRLINES:

        logoURL = "{}.{}".format(airline.code, airline.logoType)

        r = SESSION.post(
            API + "airlines",
            json = {
                "airline": {
                    "name": airline.name,
                    "logo_url": logoURL
                }
            }
        )

        if (int(r.status_code) != 201):
            print(r.status_code)
            print(r.text)
            break
        time.sleep(0.5)
        
def db_write_airports():

    return 

    login()
    read_airports()

    for airport in AIRPORTS:

        r = SESSION.post(
            API + "airports",
            json = {
                "airport": {
                    "name": airport.name,
                    "code": airport.IATA3,
                    "latitude": airport.lat,
                    "longitude": airport.lng,
                    "city": airport.city
                }
            }
        )

        if (int(r.status_code) != 201):
            print(r.status_code)
            print(r.text)
            break

        airport.set_id(r.json()["id"])
 
        time.sleep(0.25)

def db_write_flights():

    login()
    read_routes_build()

    for route in ROUTES:

        info = None
        if route.operator is not None:
            info = "{},{}".format(
                route.dist, route.operator
            )
        else:
            info = "{},".format(route.dist)

        r = SESSION.post(
            API + "flights",
            json = {
                "departs_at": route.time_to_string(route.dept),
                "arrives_at": route.time_to_string(route.arr),
                "number": route.num_as_string(),
                "plane_id": route.planeID,
                "departure_id": route.srcID,
                "arrival_id": route.destID,
                "airline_id": route.airlineID,
                "info": info
            }
        )

        route.set_id(r.json()["id"])
        if r.status_code != 201:
            print(r.status_code)
            print(r.text)
            route.p()
            break

        route.set_id(r.json()["id"])
        time.sleep(0.25) 

def db_write_planes():

    return

    login()
    read_planes()

    for plane in PLANES:

        info = "{},{}".format(plane.rows, plane.scheme)

        r = SESSION.post(
            API + "planes",
            json = {
                "name": plane.name,
                "info": info
            }
        )

        if r.status_code != 201:
            print(r.status_code)
            print(r.text)
            plane.p()
            break

        plane.set_id(r.json()["id"])

        time.sleep(0.25)

def login():

    r = SESSION.post(
        API + "sessions",
        json = {
            "user": {
                "username": USER,
                "password": PW
            }
        }
    )

def read_airlines():

    with open("airlines_id.csv", "r", newline="") as f:
        reader = csv.reader(f, delimiter=",")
        for airline in reader:
            AIRLINES.append(
                Airline(
                    airline[0], airline[1], airline[2], airline[3]
                )
            )

def read_airports():

    with open("airports_id.csv", "r", newline="") as f:
        reader = csv.reader(f, delimiter=",")
        for row in reader:
            a = Airport(
                row[0], row[1], row[2], row[3], row[4],
                row[5], row[6], row[7], row[8], row[9]
            )
            # An airport is not guarenteed to have both IATA and
            # ICAO codes.
            AIRPORTS.append(a)
            IATA3[a.IATA3] = a
            ICAO4[a.ICAO4] = a
            if a.IATA3 not in CODES:
                CODES.append(a.IATA3)
            if a.ICAO4 not in CODES:
                CODES.append(a.ICAO4)

def read_planes():

    with open("planes_id.csv", "r", newline="") as f:
        reader = csv.reader(f, delimiter=",")
        for plane in reader:
            p = Plane(
                plane[0], plane[1], plane[2], plane[3], plane[4]
            )
            if p.code not in PLANES_DICT.keys():
                PLANES_DICT[p.code] = p
                PLANES.append(p)

def read_rep_routes():

    return

    with open("routes_rep_trimmed.csv", "r", newline="") as f:
        reader = csv.reader(f, delimiter=",")
        for route in reader:
            r = Route(
                route[0], route[1], route[2],
                route[3], route[4], route[5],
                route[6]
            )
            ROUTES.append(r)

def read_routes_build():

    with open("routes_rep_build.csv", "r", newline="") as f:
        reader = csv.reader(f, delimiter=",")
        for row in reader:
            ROUTES.append(Route(
                row[0], row[1], row[2], row[3], row[4], row[5],
                row[6], row[7], row[8], row[9], row[10], row[11],
                row[12], row[13], row[14], row[15], row[16],
                row[17]
            ))

def read_routes():

    with open("routes_id.csv", "r", newline="") as f:
        reader = csv.reader(f, delimiter=",")
        for row in reader:
            ROUTES.append(Route(
                row[0], row[1], row[2], row[3], row[4], row[5],
                row[6], row[7], row[8], row[9], row[10], row[11],
                row[12], row[13], row[14], row[15], row[16],
                row[17]
            ))

def write_rep_airlines():

    return

    read_airlines()

    with open("airlines_id2.csv", "w+", newline="") as f:
        writer = csv.writer(f, delimiter=",")
        for airline in AIRLINES:
            writer.writerow(list(airline))
 
def write_rep_airports():

    return 

    with open("airports.csv", "r", newline="") as f:

        reader = csv.reader(f, delimiter=',')

        for row in reader:

            a = Airport(
                row[0], row[1], row[2], row[3], row[4],
                row[5], row[6], row[7], None
            )
            if (a.country == "United States" or a.country == "Canada"):

                # An airport is not guarenteed to have both IATA and
                # ICAO codes.
                AIRPORTS.append(a)
                IATA3[a.IATA3] = a
                ICAO4[a.ICAO4] = a


    with open("airports_rep.csv", "w+", newline="") as f:
        writer = csv.writer(f, delimiter=',')
        for airport in AIRPORTS:
            writer.writerow(list(airport))

def write_rep_airports_trimmed():

    return

    working_airports()

    with open("airports_rep_trimmed.csv", "w+", newline="") as f:
        writer = csv.writer(f, delimiter=",")
        for airport in AIRPORTS_USED:
            writer.writerow(list(airport))

def write_airports_id():

    return

    with open("airports_id.csv", "w+", newline="") as f:
        writer = csv.writer(f, delimiter=",")
        for airport in AIRPORTS:
            writer.writerow(list(airport))

def write_routes_id():

    with open("routes_id.csv", "w+", newline="") as f:
        writer = csv.writer(f, delimiter=",")
        for route in ROUTES:
            writer.writerow(list(route))

def write_planes_id():

    return

    with open("planes_id.csv", "w+", newline="") as f:
        writer = csv.writer(f, delimiter=",")
        for plane in PLANES:
            writer.writerow(list(plane))

def write_rep_routes():

    return

    with open("routes.csv", "r", newline="") as f:
        reader = csv.reader(f, delimiter=",")
        for route in reader:
            if route[6] == "Y" or route[7] != "0":
                continue
            r = Route(
                    route[0], route[1], route[4], route[5],
                    route[8], route[2], route[3]
            )
            ROUTES.append(r)

    with open("routes_rep.csv", "w+", newline="") as f:
        writer = csv.writer(f, delimiter=",")
        for route in ROUTES:
            if (route.dest in CODES and route.src in CODES):
                if (route.dest == route.src):
                    continue
                    print("BAD ROUTE: {} - {}".format(route.arline, route.dest))
                d = None
                r = None
                try:
                    d = IATA3[route.dest]
                except KeyError:
                    d = ICAO4[route.dest]
                try:
                    r = IATA3[route.src]
                except KeyError:
                    r = ICAO4[route.src]
                if d is not None and d not in AIRPORTS_USED:
                    AIRPORTS_USED.append(d)
                if r is not None and r not in AIRPORTS_USED:
                    AIRPORTS_USED.append(r)

                writer.writerow(list(route))

    with open("airports_used_rep.csv", "w+", newline="") as f:
        writer = csv.writer(f, delimiter=",")
        for airport in AIRPORTS_USED:
            writer.writerow(list(airport))

def write_rep_routes_trimmed():

    return

    read_rep_routes()

    with open("routes_rep_trimmed.csv", "w+", newline="") as f:
        writer = csv.writer(f, delimiter=",")
        for route in ROUTES:
            writer.writerow(list(route))

def write_rep_routes_build():

    read_airlines()
    read_airports()
    read_planes()

    with open("routes_rep_trimmed.csv", "r", newline="") as f:
        reader = csv.reader(f, delimiter=",")
        for row in reader:

            route = Route(
                None, row[0], None, row[1], None, None, row[2],
                None, row[3], None, None, None, row[7],
                row[4], None, row[5], None, row[6] 
            )
            ROUTES.append(route)

    b_airlineHash = {}
    b_airportHash = {}
    b_planeHash = {}
    b_airlineRouteNum = {}
    b_routesUsed = {}
    b_routesOut = []

    for airport in AIRPORTS:
        b_airportHash[airport.IATA3] = airport 
    for airline in AIRLINES:
        b_airlineHash[airline.code] = airline
        b_airlineRouteNum[airline.code] = 1
    for plane in PLANES:
        b_planeHash[plane.code] = plane

    for route in ROUTES:

        route.set_airlineID(b_airlineHash[route.airline].id)
        route.set_destID(b_airportHash[route.dest].id)
        route.set_planeID(b_planeHash[route.planeUsed].id)
        route.set_srcID(b_airportHash[route.src].id)

        ar = []
        try:
            if route.dest not in b_routesUsed[route.src]:
                b_routesUsed[route.src].append(route.dest)
            else:
                continue
        except KeyError:
            b_routesUsed[route.src] = [route.dest]
        try:
            b_routesUsed[route.dest].append(route.src)
        except KeyError:
            b_routesUsed[route.dest] = [route.src]

        route.set_dist(
            float(b_airportHash[route.dest].lat),
            float(b_airportHash[route.dest].lng),
            float(b_airportHash[route.src].lat),
            float(b_airportHash[route.src].lng)
        )

        num = random.randint(1, 100)
        if num < 50:
            num = 2
        elif num < 60:
            num = 3
        elif num < 69:
            num = 4
        elif num < 77:
            num = 5
        elif num < 84:
            num = 6
        elif num < 90:
            num = 7
        else:
            num = 8

        for i in range(1, num):
            
            routeDup = Route(
                None, route.airline, route.airlineID,
                route.airlineOF, None, None, route.dest,
                route.destID, route.destOF, route.dist, route.dur,
                None, route.operator, route.plane, route.planeID,
                route.src, route.srcID, route.srcOF
            )
            b_routesOut.append(routeDup.create(
                b_airlineRouteNum[route.airline], True
            ))
            b_airlineRouteNum[route.airline] += 2


            b_routesOut.append(routeDup)

        b_routesOut.append(route.create(
            b_airlineRouteNum[route.airline], True
        ))
        b_airlineRouteNum[route.airline] += 2
        b_routesOut.append(route)

    with open("routes_rep_build.csv", "w+", newline="") as f:
        writer = csv.writer(f, delimiter=",")
        for route in b_routesOut:
            writer.writerow(list(route))


def working_airports():

    read_rep_routes()
    read_airports()

    for route in ROUTES:
        s = None
        d = None
        try:
            s = IATA3[route.src]
        except KeyError:
            try:
                s = ICAO4[route.src]
            except KeyError:
                print(list(route))
        try:
            d = IATA3[route.dest]
        except KeyError:
            try:
                d = ICAO4[route.dest]
            except KeyError:
                print(list(route))

        if s not in AIRPORTS:
            print(list(route))
        elif s not in AIRPORTS_USED:
            AIRPORTS_USED.append(s)
        if d not in AIRPORTS:
            print(list(route))
        elif d not in AIRPORTS_USED:
            AIRPORTS_USED.append(d)
    for airport in AIRPORTS:
        if airport not in AIRPORTS_USED:
            print(list(airport))

    print("Job's done.")
 
def working_routes():

    read_airports()
    read_rep_routes()

    unknown = []
    bad = {}

    for route in ROUTES:
        if route.airline not in AIRLINES_KNOWN: 
            try:
                bad[route.airline] += 1
            except:
                bad[route.airline] = 1

    for k, v in bad.items():
        print("{} - {}".format(k, v))

def working_airport_id():

    ids = []

    read_airports()
    mx = 0
    mn = 100000000
    for airport in AIRPORTS:
        ids.append(int(airport.id))
        if int(airport.id) > mx:
            mx = int(airport.id)
        if int(airport.id) < mn:
            mn = int(airport.id)

    for i in range(mn, mx+1):
        if i not in ids:
            print(i) 

    print("Job's done")

def working_planes():

    ids = []
    read_planes()

    for plane in PLANES:
        ids.append(plane.id)

    for i in range(5, 56):
        if i not in ids:
            print("SAFADSFFSD")
    print("Job's done.")

if __name__=="__main__":
    main(sys.argv);
