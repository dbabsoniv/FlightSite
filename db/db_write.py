#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Written for Python 3.5.3
 
Program to clean airports and route data and add it to database
via the API for Fall 2018 COMP 426 final project.

This file, unlike db.py, built the DB. It's a lot cleaner.
db.py mostly failed to build the DB and cleaned up the raw datasets.

Author
------
Robert E. Price, III

Written
-------
19-20 November 2018

"""

import csv
import io
import json
import math
import os
import random
import time
import sys

import requests 

"""

ALL RANGES INCLUSIVE
General API gateways for getting groups of information do not work.
It USED to returns maximum of exactly 100 entries.
Just beacuse it's working now should not be taken for granted.
I mean, use it, but ALWAYS have a backup method for the day of.

JAVASCRIPT MUST DEAL WITH OPERATOR, IN THE CASE OF ENDEAVOR/DELTA.
There is NOTHING in the DB indicating that all Endeavor flights
should be listed as Delta with a note that they are operated by
Endeavor.

"""


API = "http://comp426.cs.unc.edu:3001/"
AIRLINES = []
AIRPORTS = []
AIRPORT_IDS = []
AIRPORTS_USED = []
CODES = []
DEPT_INFO = {}
IATA3 = {}
ICAO4 = {}
PLANES = []
PLANES_DICT= {}
RADIUS_EARTH = 6371 # Kilometers
ROUTES = []
SESSION = requests.Session()
SUBS = {"9E": "DL"}
USER = "BabsonPrice"
PW = "DaveRobert2015gehirn"

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


class Airline(object):

    def __init__(self, ID, name, code, logoType, num):

        self.code = code
        self.id = None if (ID == "") else int(ID)
        self.logoType = logoType
        self.name = name
        self.num = 1 if (num == "") else int(num)

    def __iter__(self):
        return iter([
            self.id, self.name, self.code, self.logoType,
            self.num
        ])

    def p(self):
        print(list(self))

    def set_id(self, ID):
        self.id = int(ID)
    def set_num(self, num):
        self.num = int(num)

class Airport(object):

    def __init__(
        self, ID, city, country, IATA3, ICAO4, lat, lng, OF,
        name, state, info
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
        self.info = None if (info == "") else info

        if self.id != "":
            self.id = int(self.id)
        else:
            self.id = None
        if self.state == "":
            self.state = None

    def __iter__(self):
        return iter([
            self.id, self.city, self.country, self.IATA3, self.ICAO4,
            self.lat,self.lng, self.OF, self.name, self.state,
            self.info
        ])

    def p(self):
        print(list(self))

    def get_info(self):
        return json.dumps(self.info)

    def set_id(self, ID):
        self.id = int(ID)

    def set_info(self):

        # 1 should work, but let's be safe.
        if len(DEPT_INFO) < 5:
            print("WARNING: Airplane.set_info() only works with DEPT_INFO filled.")            
            return

        self.info = DEPT_INFO[self.id]

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
        if self.destID != "" and self.destID is not None:
            self.destID = int(self.destID)
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

        if self.operator is not None:
            self.airline = "9E"
            self.airlineID = 83

        """
        if self.airline == "9E":
            self.airline = "DL"
            self.operator = "9E"
        #if self.operator == "9E":
        #    self.operatorID = ???
        #else:
        #    self.operatorID = None
        """

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

        a = self.airline;
        if (a == "9E"):
            a = "DL"
       

        return "{} {}".format(
            a, self.num
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

def build_routes():

    read_airlines("airlines_id.csv")
    read_airports("airports_id.csv")
    read_planes("planes_id.csv")
    read_routes("routes_id_simple.csv")

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

    write_file("routes_build.csv", b_routesOut);

def db_create():

    return

    login()

    read_airlines("airlines_id_old.csv")
    read_airports("airports_id_old.csv")
    read_planes("planes_id_old.csv")
    read_routes("routes_rep_build_old.csv")
    read_routes_simple()

    db_write_airlines()
    write_file("airlines_id.csv", AIRLINES)
    db_write_planes()
    write_file("planes_id.csv", PLANES)
    db_write_airports()
    write_file("airports_id_noInfo.csv", AIRPORTS)

    update_routes()
    write_file("routes_id_simple.csv", ROUTES)

    read_airlines("airlines_id.csv")
    read_airports("airports_id.csv")
    read_planes("planes_id.csv")
    read_routes("routes_id_build.csv")

    for route in ROUTES:

        airlineOP = None
        if route.operator is None:
           airlineOP = route.airlineID
        else:
            if route.operator == "9E":
                # This is Envdeavor's ID
                airlineOP = 83 
            else:
                print("PANIC: Bad route operator: {}".format(route.operator))
                return

        try:

            a = DEPT_INFO[route.srcID]

            try:

                a = DEPT_INFO[route.srcID][route.destID]
                DEPT_INFO[route.srcID][route.destID][airlineOP] = route.planeID

            except KeyError:

                DEPT_INFO[route.srcID][route.destID] = {
                    airlineOP : route.planeID
                }

        except KeyError:

            DEPT_INFO[route.srcID] = {route.destID : {
                airlineOP : route.planeID
            }}


    db_patch_airports()
    write_file("airports_id.csv", AIRPORTS)

    db_write_flights()

def db_patch_airlines():

    return

    read_airlines("airlines_id.csv")
    login()

    for airline in AIRLINES:

        logoURL = "{}.{}".format(airline.code, airline.logoType)

        r = SESSION.put(
            API + "airlines/{}".format(airline.id),
            json = {
                "airline": {
                    "name" : airline.name,
                    "logo_id" : logoURL,
                    "info" : ""
                }
            }
        )

        if r.status_code != 200:
            print(r.status_code)
            print(r.reason)
            print(r.text)
            print(r.json())
            airline.p()
            break

        time.sleep(0.25)

def db_patch_airports():

    return

    """
    # It should work with 1, but I like being safe.
    if len(DEPT_INFO) < 5:
        print(
            "WARNING: db_patch_airports only works with DEPT_INFO filled."
        )
        return
    """

    for airport in AIRPORTS:

        #airport.set_info()

        r = SESSION.put(
            API + "airports/{}".format(airport.id),
            json = {
                "airport": {
                    "name": airport.name,
                    "code": airport.IATA3,
                    "latitude": airport.lat,
                    "longitude": airport.lng,
                    "city": airport.city,
                    "info": airport.info
                }
            }
        )

        if r.status_code != 200:
            print(r.status_code)
            print(r.text)
            airport.p()
            break

        time.sleep(0.25)

def db_patch_airports_by_flights():

    return

    login()
    read_routes("routes_id_build.csv")
    read_airlines("airlines_id.csv")
    read_airports("airports_id_by_airlines.csv")

    b_src = {};

    for route in ROUTES:

        try:
            b_src[route.srcID]
            try:
                b_src[route.srcID][route.destID].append(route.id)
            except KeyError:
                b_src[route.srcID][route.destID] = [route.id]

        except KeyError:
            b_src[route.srcID] = {route.destID : [route.id]}

    for airport in AIRPORTS:

        airport.info = json.dumps(b_src[airport.id])

        r = SESSION.put(
            API + "airports/{}".format(airport.id),
            json = {
                "airport": {
                    "name": airport.name,
                    "code": airport.IATA3,
                    "latitude": airport.lat,
                    "longitude": airport.lng,
                    "city": airport.city,
                    "info": airport.info
                }
            }
        )

        if r.status_code != 200:
            print(r.status_code)
            print(r.text)
            airport.p()
            break

        time.sleep(0.25)

    write_file("airports_id_by_flights.csv", AIRPORTS)

def db_write_airlines():

    return

    for airline in AIRLINES:

        logoURL = "{}.{}".format(airline.code, airline.logoType)

        r = SESSION.post(
            API + "airlines",
            json = {
                "airline": {
                    "name" : airline.name,
                    "logo_url" : logoURL,
                }
            }
        )

        if r.status_code != 201:
            print(r.status_code)
            print(r.text)
            airline.set_id(r.json()["id"])
            airline.p()
            break

        airline.set_id(r.json()["id"])
        time.sleep(0.25)

def db_write_airports():

    return

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

        if r.status_code != 201:
            print(r.status_code)
            print(r.text)
            airport.set_id(r.json()["id"])
            airport.p()
            break

        airport.set_id(r.json()["id"])
        time.sleep(0.25)

def db_write_flights():

    return

    login()
    read_routes("routes_build.csv")

    for i, route in enumerate(ROUTES):

        """
        info = None
        if route.operator is not None:
            info = json.dumps(
                {
                    "dist": route.dist,
                    "operator": route.operator
                }
            )
        else:
            info = json.dumps(
                {
                    "dist": route.dist,
                    "operator": ""
                }
            )
        """
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
                "info": route.dist
            }
        )

        if r.status_code != 201:
            print(r.status_code)
            print(r.text)
            route.set_id(r.json()["id"])
            route.p()
            break

        route.set_id(r.json()["id"])

        if i % 1000  == 0:
            write_file("routes_id.csv", ROUTES)
        else:
            time.sleep(0.1)

    write_file("routes_id_FINAL.csv", ROUTES)

def db_write_planes():

    return

    for plane in PLANES:

        info = json.dumps(
            {
                "rows": plane.rows,
                "scheme": plane.scheme
            }
        )

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
            plane.set_id(r.json()["id"])
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

def read_airlines(fName):

    with open(fName, "r", newline="") as f:
        reader = csv.reader(f, delimiter=",")
        for airline in reader:
            AIRLINES.append(
                Airline(
                    airline[0], airline[1], airline[2], airline[3],
                    airline[4]
                )
            )

def read_airports(fName):

    with open(fName, "r", newline="") as f:
        reader = csv.reader(f, delimiter=",")
        for row in reader:
            a = Airport(
                row[0], row[1], row[2], row[3], row[4],
                row[5], row[6], row[7], row[8], row[9],
                row[10]
            )
            # An airport is not guarenteed to have both IATA and
            # ICAO codes.
            # But in practice all routes in this DB use IATA.
            AIRPORTS.append(a)
            IATA3[a.IATA3] = a
            ICAO4[a.ICAO4] = a
            if a.IATA3 not in CODES:
                CODES.append(a.IATA3)
            if a.ICAO4 not in CODES:
                CODES.append(a.ICAO4)

def read_planes(fName):

    with open(fName, "r", newline="") as f:
        reader = csv.reader(f, delimiter=",")
        for plane in reader:
            p = Plane(
                plane[0], plane[1], plane[2], plane[3], plane[4]
            )
            if p.code not in PLANES_DICT.keys():
                PLANES_DICT[p.code] = p
                PLANES.append(p)

def read_routes(fName):

    with open(fName, "r", newline="") as f:
        reader = csv.reader(f, delimiter=",")
        for row in reader:
            ROUTES.append(Route(
                row[0], row[1], row[2], row[3], row[4], row[5],
                row[6], row[7], row[8], row[9], row[10], row[11],
                row[12], row[13], row[14], row[15], row[16],
                row[17]
            ))

def read_routes_simple():

    with open("routes_rep_trimmed.csv", "r", newline="") as f:
        reader = csv.reader(f, delimiter=",")
        for row in reader:
            ROUTES.append(Route(
                None, row[0], None, row[1], None, None, row[5],
                None, row[6], None, None, None, row[7], row[4],
                None, row[2], None, row[3] 
            ))

def write_file(fName, arr):

    if os.path.isfile(fName):
        if fName == "routes_id.csv":
            try:
                os.remove(fName)
            except:
                pass
        else:
            print("WRITE WARNING: DID NOT OVERWRITE: {}".format(fName))
            fName = "{}{}{}".format(
                "a", random.randint(1, 1000000), fName
            )

    print("Writing file: {}".format(fName))

    with open(fName, "w+", newline="") as f:
        writer = csv.writer(f, delimiter=",")
        for t in arr:
            writer.writerow(list(t))

def update_routes():

    airline_codes = {}
    airport_codes = {}
    plane_codes = {}

    for airline in AIRLINES:
        airline_codes[airline.code] = airline
    for airport in AIRPORTS:
        airport_codes[airport.IATA3] = airport
    for plane in PLANES:
        plane_codes[plane.code] = plane

    for route in ROUTES:
        route.airlineID = airline_codes[route.airline].id
        route.destID = airport_codes[route.dest].id
        route.srcID = airport_codes[route.src].id
        route.planeID = plane_codes[route.planeUsed].id

if __name__ == "__main__":
