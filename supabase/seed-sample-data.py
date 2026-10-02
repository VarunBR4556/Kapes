#!/usr/bin/env python3
"""Seed a broad, realistic QA dataset into the Kapes Supabase project.

Covers every one of Karnataka's 31 district headquarters, every vehicle type,
every trip/booking/verification status, and the admin moderation flags.

Usage:
    export SUPABASE_ACCESS_TOKEN=sbp_...   # Supabase PAT (not service_role)
    python3 seed.py [--reset]

--reset deletes previously seeded @kapes.in accounts (cascades to all child
tables). The real admin account (varunkanaka24@gmail.com) is never touched.
"""
import bcrypt
import json
import os
import random
import time
import urllib.error
import urllib.request
import uuid
from datetime import datetime, timedelta, timezone

PROJECT = os.environ.get("SUPABASE_PROJECT_REF", "dhherozzahugoicjezdh")
PAT = os.environ["SUPABASE_ACCESS_TOKEN"]
SAMPLE_PASSWORD = "Kapes@Test2026"

# Exact headcount of seeded people. Drivers and customers are Karnataka-only.
SAMPLE_DRIVERS = 50
SAMPLE_CUSTOMERS = 50
API = f"https://api.supabase.com/v1/projects/{PROJECT}/database/query"
ENABLE_GUARD = "alter table public.profiles enable trigger guard_profile_privileges;"

RNG = random.Random(42)


def query(sql, tries=12):
    body = json.dumps({"query": sql}).encode()
    last = None
    for i in range(tries):
        try:
            req = urllib.request.Request(
                API, data=body,
                headers={"Authorization": f"Bearer {PAT}",
                         "Content-Type": "application/json"})
            return json.loads(urllib.request.urlopen(req, timeout=90).read().decode())
        except urllib.error.HTTPError as e:
            detail = e.read().decode()[:400]
            if e.code >= 500:
                last, _ = f"{e} {detail}", time.sleep(3 * (i + 1))
                continue
            raise RuntimeError(f"SQL rejected ({e.code}): {detail}\nSQL: {sql[:400]}")
        except Exception as e:
            last = e
            time.sleep(3 * (i + 1))
    raise RuntimeError(f"query failed: {last}\nSQL: {sql[:200]}")


def lit(v):
    if v is None:
        return "null"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return str(v)
    if isinstance(v, datetime):
        return "'" + v.isoformat() + "'"
    return "'" + str(v).replace("'", "''") + "'"


def jsq(obj):
    return "$$" + json.dumps(obj).replace("$$", "$$$$") + "$$"


# ------------------------------------------------------------------ places
# All 31 Karnataka district headquarters, canonical spellings per src/lib/search.ts
KARNATAKA = [
    ("Bengaluru", "Bengaluru Urban"), ("Mysuru", "Mysuru"),
    ("Mangaluru", "Dakshina Kannada"), ("Hubballi", "Dharwad"),
    ("Belagavi", "Belagavi"), ("Kalaburagi", "Kalaburagi"),
    ("Davanagere", "Davanagere"), ("Ballari", "Ballari"),
    ("Vijayapura", "Vijayapura"), ("Shivamogga", "Shivamogga"),
    ("Tumakuru", "Tumakuru"), ("Udupi", "Udupi"),
    ("Haveri", "Haveri"), ("Gadag", "Gadag"),
    ("Bagalkot", "Bagalkot"), ("Kolar", "Kolar"),
    ("Mandya", "Mandya"), ("Raichur", "Raichur"),
    ("Hassan", "Hassan"), ("Chikkamagaluru", "Chikkamagaluru"),
    ("Chikkaballapur", "Chikkaballapur"), ("Ramanagara", "Ramanagara"),
    ("Yadgir", "Yadgir"), ("Koppal", "Koppal"),
    ("Madikeri", "Kodagu"), ("Chamarajanagar", "Chamarajanagar"),
    ("Karwar", "Uttara Kannada"), ("Bidar", "Bidar"),
    ("Chitradurga", "Chitradurga"), ("Hosapete", "Vijayanagara"),
    ("Nelamangala", "Bengaluru Rural"),
]

VEHICLE_TYPES = ["Mini", "Truck", "Container", "Trailer"]
# exactly the values in src/lib/trips.ts defaultCargoRoom
CARGO = {
    "Mini": (180, 140, 120),
    "Truck": (320, 180, 180),
    "Container": (600, 240, 240),
    "Trailer": (1200, 250, 260),
}

FIRST = ["Ravi", "Arjun", "Lakshmi", "Rahul", "Priya", "Vikram", "Ananya", "Suresh",
         "Meera", "Karthik", "Fatima", "Ramesh", "Nagaraj", "Shruti", "Manjunath",
         "Deepa", "Girish", "Savitha", "Praveen", "Nivedita", "Harish", "Bhavana",
         "Santosh", "Vinod", "Kavya", "Mallesh", "Rekha", "Sridhar", "Padma", "Yogesh"]
LAST = ["Kumar", "Mehta", "Nair", "Verma", "Sharma", "Singh", "Iyer", "Gupta",
        "Joshi", "Reddy", "Sheikh", "Iyer", "Patil", "Hegde", "gowda", "Patil",
        "Rao", "Shetty", "Kulkarni", "Deshpande", "Naik", "Pai", "Bhat", "Menon"]
CUST_FIRST = ["Aditi", "Bharat", "Chitra", "Deepak", "Eshan", "Farhan", "Geeta",
              "Harsh", "Isha", "Jatin", "Kavya", "Lokesh", "Maya", "Nikhil", "Ojas",
              "Pooja", "Rishi", "Sneha", "Tejas", "Usha", "Vivek", "Wanya", "Yash",
              "Zoya", "Anil", "Bhavya", "Chetan", "Divya", "Eka", "Farah", "Girish"]
CUST_LAST = ["Sharma", "Patil", "Iyer", "Rao", "Khan", "Ali", "Nair", "Desai",
             "Agarwal", "Mehta", "Reddy", "Babu", "Pillai", "Joshi", "Sethi",
             "Balan", "Pandey", "Kulkarni", "Kamath", "Rao", "Hegde", "Shetty"]

VEHICLE_STATES = ["KA"]  # sample data is Karnataka-only

BUG_TEMPLATES = [
    ("Payment page shows a spinner forever",
     "Tapping Pay on the booking summary never resolves; the spinner keeps going and no error appears.", "booking", "high"),
    ("Driver dashboard trip list is empty",
     "Posted a trip but it does not appear under My Trips until a hard refresh.", "ui", "medium"),
    ("Cannot upload an RC document on mobile",
     "The file chooser does not open on Android Chrome when selecting a PDF.", "ui", "high"),
    ("Search returns no trips for a known route",
     "Searching origin Bengaluru to Mysuru returns nothing even though matching trips exist.", "tracking", "medium"),
    ("Logout returns to the landing page, not sign-in",
     "After signing out the app shows the marketing hero instead of the sign-in form.", "auth", "low"),
    ("Departure time shows the wrong day",
     "Evening trip times render as next-day morning in the trip card.", "ui", "medium"),
    ("Cargo room dimensions are wrong on the trip card",
     "The trip card shows cargo dimensions that do not match the selected vehicle type.", "ui", "medium"),
    ("Booking total price is not recalculated",
     "Changing shipment weight after picking a trip does not update the total price shown.", "booking", "high"),
    ("Profile picture upload silently fails",
     "Choosing an avatar from the gallery returns success but nothing is saved.", "ui", "medium"),
    ("Dashboard counters disagree with the trip list",
     "The open trips count on the dashboard does not match the number of rows listed.", "ui", "low"),
    ("Rejected document shows no reason",
     "A rejected RC shows the Rejected badge but the review note is empty.", "ui", "high"),
    ("Map pin drops the wrong pickup location",
     "The pickup marker lands about 2km away from the entered address.", "tracking", "medium"),
    ("Session expires unexpectedly after a refresh",
     "Refreshing the page logs the user out even though the token was still valid.", "auth", "high"),
    ("Cannot book a trip that has already departed",
     "A trip with a past departure time still accepts a new booking.", "booking", "high"),
    ("Trip status badge shows Open for a cancelled trip",
     "A cancelled trip still renders with the Open badge on the customer's trips page.", "ui", "medium"),
    ("Admin review queue misses a newly uploaded document",
     "A document uploaded a minute ago does not show in the admin queue until reload.", "ui", "medium"),
]

ISSUE_TEMPLATES = [
    ("delay", "Driver arrived about {n} hours late to pickup, so the goods reached the destination very late."),
    ("damage", "{n} cartons arrived with crushed corners and the outer wrapping torn."),
    ("missing", "{n} parcel out of the four was not handed over at dropoff."),
    ("vehicle", "Vehicle sent was an open cargo auto instead of the booked closed mini."),
    ("delay", "Heavy traffic on the highway caused a {n} hour delay in transit."),
    ("other", "Driver asked for cash payment even though the booking was already paid in-app."),
    ("damage", "Goods were shifted inside the vehicle and one crate is no longer strapped."),
    ("delay", "The vehicle broke down on the route and the load was transferred late."),
]

ACTIVITIES = [
    ("registered", "Account created"),
    ("signed_in", None),
    ("signed_in", None),
    ("posted_trip", "Posted a new trip"),
    ("uploaded_documents", "Driving licence and RC submitted for review"),
    ("booked_trip", "Booked a trip"),
    ("booked_trip", "Booked a trip"),
    ("updated_settings", "Updated account settings"),
    ("reported_issue", "Reported a transit issue"),
    ("added_vehicle", "Added a vehicle to the fleet"),
]

now = datetime.now(timezone.utc)


def build(reset):
    stmts = []
    if reset:
        stmts.append("delete from auth.users where email like '%%@kapes.in' "
                     "and email <> 'varunkanaka24@gmail.com';")

    pw = bcrypt.hashpw(SAMPLE_PASSWORD.encode(), bcrypt.gensalt(rounds=10)).decode()

    # ---------------------------------------------------------- people
    # Exactly SAMPLE_DRIVERS / SAMPLE_CUSTOMERS people, all based in Karnataka,
    # cycling the district list so every district gets covered before repeats.
    drivers = []
    for n in range(1, SAMPLE_DRIVERS + 1):
        city, dist = KARNATAKA[(n - 1) % len(KARNATAKA)]
        ver = RNG.choices(["approved", "pending", "rejected"], [82, 12, 6])[0]
        drivers.append(dict(
            idx=n, name=f"{FIRST[n % len(FIRST)]} {LAST[n % len(LAST)]}",
            phone=f"9{RNG.randint(100000000, 999999999)}",
            vnum=f"{RNG.choice(VEHICLE_STATES)} {RNG.randint(1, 59):02d} "
                 f"{chr(65 + RNG.randint(0, 25))}{chr(65 + RNG.randint(0, 25))} "
                 f"{RNG.randint(1000, 9999)}",
            vtype=RNG.choice(VEHICLE_TYPES), ver=ver, city=city, district=dist))

    customers = []
    for m in range(1, SAMPLE_CUSTOMERS + 1):
        city, dist = KARNATAKA[(m - 1) % len(KARNATAKA)]
        customers.append(dict(
            idx=m, name=f"{CUST_FIRST[m % len(CUST_FIRST)]} {CUST_LAST[m % len(CUST_LAST)]}",
            phone=f"8{RNG.randint(100000000, 999999999)}", city=city, district=dist))

    for d in drivers:
        d["uid"] = str(uuid.uuid4())
        d["email"] = f"driver{d['idx']:02d}@kapes.in"
    for c in customers:
        c["uid"] = str(uuid.uuid4())
        c["email"] = f"customer{c['idx']:02d}@kapes.in"

    users = ([(d["uid"], d["email"], d["name"], "driver") for d in drivers]
             + [(c["uid"], c["email"], c["name"], "customer") for c in customers])

    auth_rows = ",".join(
        "(%s,%s,'authenticated','authenticated',%s,%s,now(),%s,%s,now(),now(),'','','','')"
        % (lit("00000000-0000-0000-0000-000000000000"), lit(u[0]), lit(u[1]), lit(pw),
           jsq({"provider": "email", "providers": ["email"]}),
           jsq({"name": u[2], "role": u[3]}))
        for u in users)
    stmts.append(
        "insert into auth.users (instance_id,id,aud,role,email,encrypted_password,"
        "email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,"
        "confirmation_token,email_change,email_change_token_new,recovery_token) values "
        + auth_rows + " on conflict (id) do nothing;")

    # GoTrue resolves password sign-in through auth.identities, so a user row on
    # its own cannot log in. Without this every seeded account looks correct in
    # the database but is rejected at sign-in.
    identity_rows = ",".join(
        "(gen_random_uuid(),%s,%s,'email',%s::jsonb,now(),now(),now())"
        % (lit(u[0]), lit(u[0]),
           jsq({"sub": u[0], "email": u[1], "email_verified": True,
                "phone_verified": False, "name": u[2], "role": u[3]}))
        for u in users)
    stmts.append(
        "insert into auth.identities (id,user_id,provider_id,provider,identity_data,"
        "last_sign_in_at,created_at,updated_at) values "
        + identity_rows + " on conflict (provider_id, provider) do nothing;")

    # ------------------------------------------------ profiles (guard off)
    meta = []
    for d in drivers:
        created = now - timedelta(days=RNG.randint(3, 120), hours=RNG.randint(0, 23))
        flag = RNG.choices([None, "held", "warned", "blocked"], [90, 3, 4, 3])[0]
        meta.append({"id": d["uid"], "phone": d["phone"], "ver": d["ver"], "city": d["city"],
                     "sub": (created - timedelta(days=RNG.randint(0, 3))).isoformat(),
                     "created": created.isoformat(), "flag": flag,
                     "at": (created + timedelta(days=2)).isoformat()})
    for c in customers:
        created = now - timedelta(days=RNG.randint(2, 180), hours=RNG.randint(0, 23))
        flag = RNG.choices([None, "held", "warned", "blocked"], [94, 2, 2, 2])[0]
        meta.append({"id": c["uid"], "phone": c["phone"], "ver": None, "city": c["city"],
                     "sub": None, "created": created.isoformat(), "flag": flag,
                     "at": (created + timedelta(days=1)).isoformat()})

    stmts.append("alter table public.profiles disable trigger guard_profile_privileges;")
    stmts.append(
        "update public.profiles p set "
        "  phone = (m->>'phone'),"
        "  driver_verification = m->>'ver',"
        "  documents_submitted_at = (m->>'sub')::timestamptz,"
        "  created_at = (m->>'created')::timestamptz,"
        "  held       = coalesce(m->>'flag' = 'held', false),"
        "  held_at    = case when m->>'flag' = 'held'   then (m->>'at')::timestamptz end,"
        "  warned     = coalesce(m->>'flag' = 'warned', false),"
        "  warned_at  = case when m->>'flag' = 'warned' then (m->>'at')::timestamptz end,"
        "  blocked    = coalesce(m->>'flag' = 'blocked', false),"
        "  blocked_at = case when m->>'flag' = 'blocked' then (m->>'at')::timestamptz end "
        "from jsonb_array_elements(" + jsq(meta) + "::jsonb) as m "
        "where p.id = (m->>'id')::uuid;")
    stmts.append(ENABLE_GUARD)

    # --------------------------------------------------------- vehicles
    vids, vehicle_rows = {}, []
    for d in drivers:
        l, b, h = CARGO[d["vtype"]]
        vid = str(uuid.uuid4())
        vids[d["uid"]] = vid
        vehicle_rows.append(
            "(%s,%s,%s,%s,true,%d,%d,%d,null,now())"
            % (lit(vid), lit(d["uid"]), lit(d["vnum"]), lit(d["vtype"]), l, b, h))
        if RNG.random() < 0.35:                      # some fleets run two vehicles
            alt_type = RNG.choice(VEHICLE_TYPES)
            l2, b2, h2 = CARGO[alt_type]
            vnum2 = d["vnum"].rsplit(" ", 1)[0] + f" {RNG.choice('XYZQST')} {RNG.randint(1000, 9999)}"
            vids[d["uid"] + ":alt"] = str(uuid.uuid4())
            vehicle_rows.append(
                "(%s,%s,%s,%s,false,%d,%d,%d,null,now())"
                % (lit(vids[d["uid"] + ":alt"]), lit(d["uid"]), lit(vnum2),
                   lit(alt_type), l2, b2, h2))
        if RNG.random() < 0.08:                      # a retired vehicle, kept archived
            l3, b3, h3 = CARGO[d["vtype"]]
            vids[d["uid"] + ":gone"] = str(uuid.uuid4())
            vehicle_rows.append(
                "(%s,%s,%s,%s,false,%d,%d,%d,now(),now())"
                % (lit(vids[d["uid"] + ":gone"]), lit(d["uid"]),
                   lit(d["vnum"].rsplit(" ", 1)[0] + " OL 0001"), lit(d["vtype"]),
                   l3, b3, h3))
    stmts.append(
        "insert into public.vehicles (id,user_id,vehicle_number,vehicle_type,is_primary,"
        "length_cm,breadth_cm,height_cm,removed_at,created_at) values "
        + ",".join(vehicle_rows) + " on conflict (id) do nothing;")

    # -------------------------------------------------------- documents
    REJECT = {
        "blurred": "Image is not legible, please upload a clearer scan of the RC.",
        "mismatch": "RC number on the document does not match the registered vehicle number.",
        "partial": "Only the first page was uploaded, the full RC is required.",
    }
    doc_rows, pending_queue = [], 0
    for d in drivers:
        up = now - timedelta(days=RNG.randint(1, 90))
        rc = {"approved": "approved", "pending": "pending", "rejected": "rejected"}[d["ver"]]
        lic = "approved" if d["ver"] != "pending" else "pending"
        if d["ver"] == "pending":
            pending_queue += 1
        doc_rows.append(
            "(%s,%s,%s,%s,%s,%s,%s,%s,now(),%s)"
            % (lit(str(uuid.uuid4())), lit(d["uid"]), lit(vids[d["uid"]]),
               lit("driving_licence"), lit("licence-%s.pdf" % d["uid"][:8]),
               lit("%s/licence.pdf" % d["uid"]), lit(lic), lit(None),
               lit(up) if lic != "pending" else lit(None)))
        doc_rows.append(
            "(%s,%s,%s,%s,%s,%s,%s,%s,now(),%s)"
            % (lit(str(uuid.uuid4())), lit(d["uid"]), lit(vids[d["uid"]]),
               lit("vehicle_rc"), lit("rc-%s.pdf" % d["uid"][:8]),
               lit("%s/rc.pdf" % d["uid"]), lit(rc),
               lit(RNG.choice(list(REJECT.values())) if rc == "rejected" else None),
               lit(up) if rc != "pending" else lit(None)))
        if d["uid"] + ":alt" in vids:                 # RC for the second vehicle
            st = "pending" if d["ver"] != "approved" else RNG.choice(["pending", "approved"])
            doc_rows.append(
                "(%s,%s,%s,%s,%s,%s,%s,%s,now(),%s)"
                % (lit(str(uuid.uuid4())), lit(d["uid"]), lit(vids[d["uid"] + ":alt"]),
                   lit("vehicle_rc"), lit("rc-alt-%s.pdf" % d["uid"][:8]),
                   lit("%s/rc-alt.pdf" % d["uid"]), lit(st), lit(None),
                   lit(up) if st != "pending" else lit(None)))
    stmts.append(
        "insert into public.driver_documents (id,user_id,vehicle_id,kind,file_name,"
        "file_path,status,review_note,uploaded_at,reviewed_at) values "
        + ",".join(doc_rows) + " on conflict (id) do nothing;")

    # ------------------------------------------------------------- trips
    approved = [d for d in drivers if d["ver"] == "approved"]
    kn = [c for c, _ in KARNATAKA]
    trip_ids, trip_status, trip_rows, trip_places, trip_cap = [], [], [], [], []
    for d in approved:
        for _ in range(RNG.randint(3, 7)):
            # intra-Karnataka only: sample data stays inside the state
            o, dest = RNG.sample(kn, 2)
            l, b, h = CARGO[d["vtype"]]
            dep = now + timedelta(days=RNG.randint(-6, 30),
                                  hours=RNG.randint(0, 23), minutes=RNG.choice([0, 30]))
            status = RNG.choices(
                ["open", "matched", "completed", "cancelled"], [42, 22, 30, 6])[0]
            cap = RNG.choice([250, 500, 750, 1000, 1500, 2000, 3000, 5000, 8000, 12000])
            tid = str(uuid.uuid4())
            trip_ids.append(tid)
            trip_status.append(status)
            trip_places.append((o, dest))
            trip_cap.append(cap)
            trip_rows.append(
                "(%s,%s,%s,%s,%s,%s,%s,%d,%s,%d,%d,%d,%s,%s,%s,%s)"
                % (lit(tid), lit(d["uid"]), lit(o), lit(dest), lit(dep.date()),
                   lit(dep.strftime("%H:%M:00")), lit(d["vtype"]), cap,
                   lit(round(RNG.uniform(6, 48), 2)), l, b, h, lit(status),
                   lit(now - timedelta(days=RNG.randint(0, 14))),
                   lit(d["name"]), lit(d["vnum"])))
    stmts.append(
        "insert into public.trips (id,driver_id,origin,destination,departure_date,"
        "departure_time,vehicle_type,capacity_kg,price_per_kg,length_cm,breadth_cm,"
        "height_cm,status,created_at,driver_name,driver_vehicle) values "
        + ",".join(trip_rows) + " on conflict (id) do nothing;")

    # ---------------------------------------------------------- bookings
    # Never book past a trip's capacity. The app enforces this in the browser,
    # but the seeder writes straight to the table and previously ignored it,
    # which left most sample trips holding more weight than they could carry.
    book_rows, made = [], []
    for i, (tid, st) in enumerate(zip(trip_ids, trip_status)):
        if st == "cancelled":
            continue
        o_city, d_city = trip_places[i]
        remaining = trip_cap[i]
        for _ in range(RNG.randint(1, 3)):
            fits = [w for w in [80, 120, 180, 250, 400, 600, 900, 1500, 2500]
                    if w <= remaining]
            if not fits:
                break
            w = RNG.choice(fits)
            remaining -= w
            c = customers[i % len(customers)]
            bstatus = {"open": "pending", "matched": RNG.choice(["confirmed", "in_transit"]),
                       "completed": RNG.choice(["delivered", "in_transit", "delivered"])}[st]
            bid = str(uuid.uuid4())
            made.append((bid, tid, c, o_city, d_city))
            book_rows.append(
                "(%s,%s,%s,%d,%d,%d,%d,%s,%s,%s,%s,%s)"
                % (lit(bid), lit(tid), lit(c["uid"]), w,
                   RNG.choice([60, 80, 100, 120]), RNG.choice([50, 60, 70, 80]),
                   RNG.choice([60, 70, 80, 90]),
                   lit(f"{o_city} {RNG.choice(['warehouse', 'godown', 'hub', 'yard'])} {RNG.randint(1, 40)}"),
                   lit(f"{d_city} {RNG.choice(['gate', 'yard', 'depot', 'store'])} {RNG.randint(1, 20)}"),
                   lit(bstatus), lit(round(w * RNG.uniform(7, 46), 2)),
                   lit(now - timedelta(days=RNG.randint(0, 25)))))
    stmts.append(
        "insert into public.bookings (id,trip_id,customer_id,shipment_weight_kg,"
        "length_cm,breadth_cm,height_cm,pickup_address,dropoff_address,status,"
        "total_price,created_at) values "
        + ",".join(book_rows) + " on conflict (id) do nothing;")

    # ---------------------------------------------------- transit issues
    issue_rows = []
    for i, (bid, tid, c, o_city, d_city) in enumerate(made):
        if RNG.random() > 0.22:
            continue
        cat, tpl = RNG.choice(ISSUE_TEMPLATES)
        st = RNG.choices(["open", "resolved"], [65, 35])[0]
        issue_rows.append(
            "(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,now(),%s)"
            % (lit(str(uuid.uuid4())), lit(bid), lit(tid), lit(o_city), lit(d_city),
               lit(c["uid"]), lit(c["name"]), lit("customer"), lit(cat),
               lit(tpl.format(n=RNG.randint(2, 6))), lit(st),
               lit(now - timedelta(hours=RNG.randint(2, 400)))
               if st == "resolved" else lit(None)))
    stmts.append(
        "insert into public.transit_issues (id,booking_id,trip_id,origin,destination,"
        "reporter_id,reporter_name,reporter_role,category,message,status,created_at,"
        "resolved_at) values " + ",".join(issue_rows) + " on conflict (id) do nothing;")

    # --------------------------------------------------------- bug reports
    bug_rows = []
    for i, (title, desc, cat, sev) in enumerate(BUG_TEMPLATES * 2):
        c = customers[(i * 7) % len(customers)]
        st = RNG.choices(["open", "in_progress", "fixed"], [50, 30, 20])[0]
        bug_rows.append(
            "(%s,%s,%s,%s,%s,%s,%s,%s,now(),%s)"
            % (lit(str(uuid.uuid4())), lit(title), lit(desc), lit(cat), lit(sev),
               lit(st), lit(c["uid"]), lit(c["name"]),
               lit(now) if st == "fixed" else lit(None)))
    stmts.append(
        "insert into public.bug_reports (id,title,description,category,severity,status,"
        "reporter_id,reporter_name,created_at,updated_at) values "
        + ",".join(bug_rows) + " on conflict (id) do nothing;")

    # ----------------------------------------------------- profile activity
    act_rows = []
    for i, u in enumerate(users):
        for j, (act, det) in enumerate(ACTIVITIES):
            if RNG.random() < 0.45:
                continue
            act_rows.append(
                "(%s,%s,%s,%s,%s)"
                % (lit(str(uuid.uuid4())), lit(u[0]), lit(act), lit(det),
                   lit(now - timedelta(days=RNG.randint(0, 90), hours=RNG.randint(0, 23)))))
    stmts.append(
        "insert into public.profile_activity (id,user_id,action,detail,created_at) values "
        + ",".join(act_rows) + " on conflict (id) do nothing;")

    return stmts, drivers, customers, pending_queue


TABLES = ["profiles", "vehicles", "driver_documents", "trips", "bookings",
          "transit_issues", "bug_reports", "profile_activity"]

if __name__ == "__main__":
    reset = "--reset" in __import__("sys").argv
    stmts, drivers, customers, pq = build(reset)
    try:
        for i, s in enumerate(stmts, 1):
            query(s)
            print(f"  [{i}/{len(stmts)}] ok")
    finally:
        query(ENABLE_GUARD)
        print("  guard trigger re-enabled")

    print(f"\npeople: {len(drivers)} drivers, {len(customers)} customers")
    print("\nrow counts:")
    total = 0
    for t in TABLES:
        n = query(f"select count(*) as n from public.{t};")[0]["n"]
        total += n
        print(f"  {t:<20} {n}")
    print(f"  {'TOTAL':<20} {total}")
    print("\nKarnataka districts covered:")
    cov = query("select count(distinct origin) + count(distinct destination) as c "
                "from public.trips;")
    rows = query("select origin as c from public.trips union "
                 "select destination from public.trips order by 1;")
    kn_hit = [r["c"] for r in rows if r["c"] in [k for k, _ in KARNATAKA]]
    print(f"  {len(kn_hit)}/{len(KARNATAKA)} Karnataka cities appear on a trip")
    missing = [k for k, _ in KARNATAKA if k not in kn_hit]
    if missing:
        print("  missing:", ", ".join(missing))
    print(f"\nsample account password: {SAMPLE_PASSWORD}")
