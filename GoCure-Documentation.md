# GoCure — Complete Project Documentation

**Hyperlocal medicine delivery platform** — a Blinkit/Zepto-style app purpose-built
for pharmacies: zero-inventory matching across nearby pharmacies, AI-assisted
prescription verification, and a relay-based logistics engine for orders that
need stock from two pharmacies at once.

This document describes what has been built, how it's architected, and what's
left to do to run it as a real production business.

---

## 1. Project vision

Connect customers to local pharmacies for 30-minute delivery, without any
pharmacy needing to hand over its inventory system. The platform:

- Matches a customer's order against live stock at the *nearest* pharmacy
- If that pharmacy is short on one item, automatically sources it from the
  next-nearest pharmacy that has it
- If that second pharmacy is far enough away that one rider can't reasonably
  do both pickups, splits the delivery across **two riders** who meet at a
  computed midpoint to hand off the missing item — so the customer still gets
  one order, one delivery, on time
- Keeps customer identity encrypted away from vendors — a pharmacy sees an
  order code and a list of items, never a name, phone number, or address
- Runs prescription images through OCR as a first pass, with the pharmacist
  always making the final call before an order proceeds

---

## 2. Who uses it — four apps, one system

| App | Subdomain (planned) | Used by | Core job |
|---|---|---|---|
| **Shop** | `gocure.in` | Customers | Browse pharmacies, order, upload prescriptions, track delivery live |
| **Vendor** | `vendor.gocure.in` | Pharmacy staff | Review incoming orders, approve/reject prescriptions, manage stock |
| **Rider** | `rider.gocure.in` | Delivery riders | Accept tasks, navigate, update delivery status, share live GPS |
| **Admin** | `admin.gocure.in` | Operations/founder | System-wide stats, order log, user directory, onboard new vendors/riders |

All four talk to one shared backend (`api.gocure.in`), and stay in sync with
each other in real time — a vendor approving a prescription updates the
customer's tracking screen within a second, with no page refresh.

---

## 3. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Backend runtime | Node.js 22+ | Widely supported, easy to host anywhere |
| Backend framework | Express | Minimal, well understood, easy to extend |
| Database | PostgresSQL |
| Real-time | Socket.io | Battle-tested WebSocket layer with automatic fallback and room support |
| Auth | JWT + bcrypt | Stateless tokens, industry-standard password hashing |
| OCR | Tesseract.js | Runs entirely in the browser, free, no API key |
| Maps | Leaflet + OpenStreetMap tiles | Real interactive map, free, no API key |
| Routing | OSRM (public demo instance) | Real driving-route polylines, not straight lines |
| Frontend | Vanilla HTML/CSS/JS (no framework) | Four small apps, no build step, easy for anyone to read and edit directly |

No framework (React/Vue) was used for the frontend deliberately — each app is
a handful of files you can open and edit directly, with no `npm run build`
step standing between you and a change taking effect.

---

## 4. System architecture

```
                         ┌─────────────────────┐
                         │   api.gocure.in      │
                         │   (Express + Socket) │
                         │                      │
                         │  ┌────────────────┐  │
                         │  │ SQLite database │  │
                         │  └────────────────┘  │
                         └──────────┬───────────┘
                    REST + WebSocket │
        ┌───────────────┬───────────┼───────────────┬───────────────┐
        │                │           │               │               │
 ┌──────▼─────┐  ┌───────▼────┐ ┌────▼───────┐ ┌─────▼──────┐
 │ gocure.in   │  │vendor.     │ │rider.      │ │admin.      │
 │ (Shop app)  │  │gocure.in   │ │gocure.in   │ │gocure.in   │
 │             │  │(Vendor app)│ │(Rider app) │ │(Admin app) │
 └─────────────┘  └────────────┘ └────────────┘ └────────────┘
```

Each frontend app is a fully independent static site — no shared server-side
rendering, no monorepo build tooling. They only share a design system
(`css/tokens.css`) and a small API helper (`js/api.js`), copied into each
app's own folder so any one of them can be deployed or modified in isolation.

### Real-time architecture (Socket.io rooms)

- `order:<id>` — joined by the customer tracking an order and any rider
  assigned to it. Receives `order:update` and `rider:location` events.
- `vendor:<pharmacyId>` — joined by a pharmacy's dashboard. Receives
  `order:update` events, but with customer PII stripped out (see §8).
- `riders` — joined by every online rider. Receives every `order:update`, so
  the task board refreshes itself without polling.

---

## 5. Data model

```
users            id, role (customer/vendor/rider/admin), name, phone, password_hash,
                 address, lat, lng

pharmacies       id, vendor_user_id, name, address, lat, lng, is_open

products         id, pharmacy_id, name, category (otc/prescription),
                 price, stock, unit, is_active

orders           id, order_code, customer_id, pharmacy_id, status,
                 requires_prescription, prescription_path, ocr_text, ocr_confidence,
                 subtotal, delivery_fee, total, payment_status, payment_ref,
                 drop_lat, drop_lng, drop_address,
                 is_relay, relay_pharmacy_id, relay_node_lat, relay_node_lng,
                 rider_id, relay_rider_id, relay_status,
                 created_at, updated_at

order_items      id, order_id, product_id, from_relay_pharmacy, name, qty, price

order_events     id, order_id, status, note, created_at   (audit trail / timeline)

rider_locations  rider_id, lat, lng, is_online, updated_at
```

### Order status lifecycle

```
pending_verification ──(vendor rejects)──> rejected
        │
   (vendor approves, or no Rx needed)
        ▼
    verified ──(vendor packs)──> awaiting_rider ──(rider accepts)──> rider_assigned
                                                                            │
                                                                     (rider picks up)
                                                                            ▼
                                              ┌── not a relay order ──> picked_up
                                              │                             │
                                        is a relay order                    │
                                              ▼                             │
                                        relay_pending                       │
                                   (2nd rider does their leg)               │
                                              ▼                             │
                                        relay_handoff                       │
                                              │                             │
                                              └─────────────┬───────────────┘
                                                             ▼
                                                        on_the_way
                                                             ▼
                                                         delivered
```

---

## 6. The relay algorithm (core business logic)

When a customer places an order:

1. For each item, check stock at the chosen pharmacy.
2. If it's available there, use it — done.
3. If not, search every other open pharmacy for the same medicine (matched by
   name) with enough stock, and pick the **nearest** one (haversine distance).
4. If every item can be sourced from the primary pharmacy plus at most one
   other, and that other pharmacy is:
   - **within 2km** → order proceeds normally; one rider swings by both
     pickup points (no relay, just a slightly longer single-rider route)
   - **more than 2km away** → a relay is triggered: the system computes the
     geographic midpoint between the two pharmacies and stores it as the
     `relay_node`. Two riders are now needed:
     - **Primary rider**: picks up from the main pharmacy, waits at the
       handoff node, then continues to the customer
     - **Relay rider**: picks up the missing item from the second pharmacy,
       meets the primary rider at the node, hands it off
5. The primary rider's "on the way to customer" action is **blocked at the
   API level** until the relay rider has confirmed handoff — this isn't just
   a UI restriction, the backend rejects the status transition if the relay
   leg isn't complete yet.
6. If no pharmacy anywhere has enough stock, the order is rejected with a
   clear error before payment.

---

## 7. Feature list by app

### Shop (customer) app
- Phone + password auth, self-registration
- Geolocation-based pharmacy discovery, sorted by distance (falls back to
  saved address if location is denied)
- Product browsing per pharmacy, OTC vs. prescription clearly badged
- Cart with live quantity controls
- **Prescription upload with in-browser OCR** (Tesseract.js) — shows the
  extracted text and confidence score before submitting, so the customer
  knows what the pharmacist will see
- Checkout blocked until a required prescription is attached
- Order history
- **Live order tracking**: real interactive map (pan/zoom, real streets),
  live rider position, real driving-route polyline, relay visualization
  (shows both riders and the handoff node when relevant), step-by-step status
  timeline

### Vendor (pharmacy) app
- Order queue, grouped by what needs action right now (Rx review / pack /
  waiting on rider)
- **Prescription verification sandbox**: side-by-side view of the uploaded
  image and the OCR text extraction, with Approve/Reject
- One-tap "mark packed & ready" to release an order to the rider pool
- Inventory sync: live stock editing, active/inactive toggle per product
- Never sees customer name, phone, or address (privacy wall — see §8)
- Live-updating stat cards (active orders, needs review, to pack, awaiting rider)

### Rider app
- Online/offline toggle that starts/stops GPS sharing
- Task board: primary deliveries and relay pickup legs shown separately,
  refreshes automatically as new orders are packed
- One task at a time — accepting a task locks the board until it's delivered
- Big, thumb-friendly status buttons appropriate to the current step
  (different button set for a relay leg vs. a primary leg)
- **Real GPS** if location permission is granted; if denied, a simulated
  walk-toward-the-destination fallback so the flow can still be demoed
  indoors
- Live map showing the rider's own position and the next waypoint

### Admin app
- System-wide stats: total/delivered orders, relay-order count, revenue,
  pharmacy/rider counts
- Order-status breakdown
- Full order log and user directory
- **Provisioning**: create new vendor accounts (with their linked pharmacy —
  name, address, coordinates) or rider accounts directly from the dashboard

---

## 8. Security & privacy

- Passwords hashed with bcrypt, never stored or logged in plaintext
- JWT-based auth, 30-day expiry, role embedded in the token and checked on
  every protected route
- **Privacy wall**: the vendor-facing API responses and Socket.io events have
  `customer_id`, `drop_address`, `drop_lat`, `drop_lng` stripped out before
  they ever leave the server — this isn't a frontend hiding rule, a
  vendor's browser literally never receives that data
- Role-based route protection on every backend endpoint (`authMiddleware`) —
  a rider token can't call vendor-only endpoints, etc.
- CORS is wide open by default for local development, and lockable to your
  real subdomains via `ALLOWED_ORIGINS` in production (see §10)

---

## 9. API reference (summary)

Base path: `/api`

| Method | Path | Who | Purpose |
|---|---|---|---|
| POST | `/auth/register` | public | Customer self-registration |
| POST | `/auth/login` | public | Login, any role |
| GET | `/pharmacies?lat=&lng=` | public | Nearby pharmacies, sorted by distance |
| GET | `/pharmacies/:id/products` | public | Product listing for a pharmacy |
| POST | `/orders` | customer | Place an order (runs relay-matching logic) |
| POST | `/orders/:id/prescription` | customer | Upload Rx image + client-side OCR result |
| POST | `/orders/:id/verify` | vendor | Approve/reject a prescription |
| POST | `/orders/:id/ready` | vendor | Mark packed & ready for pickup |
| POST | `/orders/products/:id/stock` | vendor | Update stock / active state |
| GET | `/orders/rider/available` | rider | Task board (primary + relay legs) |
| POST | `/orders/:id/accept` | rider | Accept a primary or relay leg |
| POST | `/orders/:id/status` | rider | Advance order status |
| GET | `/orders/:id` | any authenticated | Full order detail |
| GET | `/orders/customer/mine` | customer | Order history |
| GET | `/orders/vendor/queue` | vendor | This pharmacy's order queue (PII-redacted) |
| GET | `/admin/stats` \| `/orders` \| `/users` | admin | Dashboards |
| POST | `/admin/provision` | admin | Create a vendor or rider account |

### Socket.io events

| Event | Direction | Payload |
|---|---|---|
| `join:order` | client → server | orderId — subscribe to one order's updates |
| `join:vendor` | client → server | pharmacyId — subscribe to a pharmacy's queue |
| `order:update` | server → client | full (or PII-redacted) order object |
| `rider:location` | both directions | `{ lat, lng, orderId? }` |

---

## 10. What's real vs. what needs your credentials

**Fully real, working today, no external accounts needed:**
- Database, auth, the relay-matching algorithm, real-time sync, OCR, GPS,
  the privacy wall, the interactive map with real routing

**Needs your input before going live:**
- **Payments** — Razorpay is wired for test mode in the schema
  (`payment_status`, `payment_ref` fields exist); add your Razorpay keys and
  a checkout call to activate real charging
- **Domain & hosting** — `gocure.in` and its subdomains need to be
  registered/pointed and each app deployed (full step-by-step guide is in
  `README.md` in the project folder)
- **Production-scale routing** — the free OSRM demo server used for route
  polylines is rate-limited; self-host OSRM or move to a paid routing API
  before real traffic
- **Postgres migration** — SQLite is fine for a beta; `backend/db/database.js`
  is the single file to swap out for Postgres before you have concurrent
  write load that SQLite can't handle well

---

## 11. Local development

```bash
cd backend
npm install
npm run seed      # creates demo pharmacies, products, and one account per role
npm start          # http://localhost:4000
```

Then open any of `apps/shop/index.html`, `apps/vendor/index.html`,
`apps/rider/index.html`, `apps/admin/index.html` directly in a browser. Each
app auto-detects it's running locally and points at `localhost:4000` — no
config edits needed until you actually deploy.

Demo accounts (password `demo1234` for all): customer `9000000006`, vendors
`9000000002` / `9000000003`, riders `9000000004` / `9000000005`, admin
`9000000001`.

---

## 12. Production deployment

Full step-by-step instructions (DNS setup, hosting each app, locking down
CORS, moving to Postgres, self-hosting routing, adding Razorpay) are in
`README.md` at the project root — this documentation focuses on what the
system *is*; the README focuses on *standing it up*.

---

## 13. Suggested next steps, roughly in priority order

1. Decide on and register the domain, pick hosting for the backend and the
   four static apps (Vercel/Netlify + Railway/Render is the fastest path)
2. Add real Razorpay keys and wire the checkout call
3. Onboard your first 1–2 real pharmacies through the admin panel, replacing
   the demo Apollo Care / MedPlus Express data
4. Run a small closed-beta exactly like the original plan describes: pick one
   3–5km neighborhood, a couple of real riders, and watch the relay system
   under real conditions before opening it wider
5. Once order volume picks up, migrate SQLite → Postgres and OSRM demo →
   self-hosted/paid routing
