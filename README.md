# 🚌 Nepal Bus Tickets

**Pick a route. Choose your seat. Travel with ease.**

Nepal Bus Tickets is a full-stack bus seat reservation system built with **Django REST Framework**, **PostgreSQL**, and a **vanilla HTML/CSS/JavaScript** frontend. Passengers choose a route, see a live 40-seat map, and book a seat in seconds, while the backend makes sure no seat is ever sold twice.

Whether two passengers click the same seat at the same moment or one refreshes the page after booking, the system keeps every seat accurate and every booking safe.

## ✨ Features

### 🚌 Route Browsing
- Routes load automatically from the Django backend
- View origin, destination, departure time, fare (NPR), and bus name
- Switch between routes and the seat map updates instantly

### 💺 Interactive Seat Map
- Visible 40-seat layout (2 + 2 seats with a center aisle)
- Click an available seat to select it
- Already-booked seats are shown in **gray** and are **unclickable**
- Legend for Available, Selected, and Taken seats

### 📝 Booking System
- Enter passenger full name and phone number
- Nepali mobile number validation (starts with 97 or 98, 10 digits)
- Live booking summary showing route, bus, seat, and fare
- Booking button stays disabled until a route and seat are chosen
- Success and error messages after every booking attempt

### 🔒 Safe Concurrent Booking
- Serializer validation blocks already-taken seats with a friendly message
- `transaction.atomic()` with `select_for_update()` locks the route during booking
- `unique_together` in PostgreSQL acts as the final safety net
- Conflicts return a clean `409` response instead of crashing

### 🛠️ Admin Panel
- Add and manage buses, routes, and bookings from Django's built-in admin

### 🌐 CORS Security
- Only trusted frontend origins can talk to the API

## 📄 Pages and Files

| File | Description |
|------|-------------|
| 🏠 `frontend/index.html` | Main page with route selector, seat grid, and checkout form |
| ⚙️ `frontend/app.js` | Fetches routes, draws the seat map, and sends bookings to Django |
| 🗄️ `tickets/models.py` | Bus, Route, and Booking database tables |
| ✅ `tickets/serializers.py` | JSON conversion and seat validation |
| 🔌 `tickets/views.py` | API views with transaction handling |
| 🔗 `tickets/urls.py` | API paths for routes and bookings |
| 🔧 `bus_project/settings.py` | PostgreSQL, CORS, and DRF configuration |

## 📸 Preview

![Nepal Bus Tickets booking page](![Uploading Screenshot 2026-10-07 230615.png…]()
)

*A confirmed booking: seat 1 is now gray and unclickable, and a success message is shown.*

## 🛠️ Tech Stack

- Python
- Django
- Django REST Framework
- PostgreSQL (`psycopg2`)
- django-cors-headers
- HTML5
- CSS3
- JavaScript (Vanilla JS, `fetch` API)

No frontend frameworks are used.

## 📂 Project Structure

```
bus_booking/
│
├── manage.py
├── requirements.txt
├── README.md
│
├── screenshots/
│   └── booking-page.png
│
├── bus_project/
│   ├── settings.py
│   └── urls.py
│
├── tickets/
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   └── admin.py
│
└── frontend/
    ├── index.html
    └── app.js
```

## 🚀 Getting Started

### Prerequisites

- Python 3.10 or newer
- PostgreSQL installed and running
- Git

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/bus_booking.git
cd bus_booking
```

### 2. Create and activate a virtual environment

```bash
python -m venv venv

# Mac / Linux
source venv/bin/activate

# Windows
venv\Scripts\activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Create the PostgreSQL database

Open the PostgreSQL shell (`psql -U postgres`) and run:

```sql
CREATE DATABASE bus_booking_db;
CREATE USER bus_user WITH PASSWORD 'bus_password123';
ALTER ROLE bus_user SET client_encoding TO 'utf8';
GRANT ALL PRIVILEGES ON DATABASE bus_booking_db TO bus_user;
ALTER DATABASE bus_booking_db OWNER TO bus_user;
\q
```

These values match the `DATABASES` setting in `bus_project/settings.py`.

### 5. Create the tables and an admin user

```bash
python manage.py migrate
python manage.py createsuperuser
```

### 6. Start the backend

```bash
python manage.py runserver
```

### 7. Add sample data

1. Open `http://127.0.0.1:8000/admin/` and log in.
2. Add a **Bus** (for example: `Greenline Deluxe`, plate `BA 1 KHA 1234`, 40 seats).
3. Add a **Route** (for example: Kathmandu to Pokhara, a future date and time, fare `1500`).

### 8. Start the frontend

In a second terminal:

```bash
cd frontend
python -m http.server 5500
```

Open **http://127.0.0.1:5500** in your browser.

> Do not open `index.html` by double-clicking it. Browsers send a `null` origin for `file://` pages and CORS will block the requests.

## 🗄️ Database Design

```
Bus (1) ────< Route (1) ────< Booking
```

| Table | Key Fields |
|-------|-----------|
| **Bus** | `name`, `plate_number` (unique), `total_seats` |
| **Route** | `bus` (FK), `origin`, `destination`, `departure_time`, `fare` |
| **Booking** | `route` (FK), `seat_number`, `passenger_name`, `phone`, `created_at` |

The `Booking` table uses `unique_together = ('route', 'seat_number')`, so PostgreSQL itself refuses a second booking for the same seat on the same route.

## 🔒 How Double-Booking Is Prevented

Imagine two people click "Book" for seat 12 at the same instant. The system protects against this in three layers:

1. **Serializer validation:** `BookingSerializer.validate()` checks whether the seat is already taken and returns a friendly error.
2. **Row locking:** the booking view runs inside `transaction.atomic()` and uses `select_for_update()` to lock the route row. A second request for the same route waits until the first finishes, then sees the seat as taken.
3. **Database constraint:** `unique_together` on `(route, seat_number)` is the final safety net. If anything above fails, PostgreSQL rejects the duplicate and the API answers with `409 Conflict`.

## 📡 API Reference

Base URL: `http://127.0.0.1:8000/api`

### `GET /api/routes/`

Returns all routes, including the seats that are already booked.

```json
[
  {
    "id": 1,
    "bus_name": "Greenline Deluxe",
    "origin": "Kathmandu",
    "destination": "Pokhara",
    "departure_time": "2026-10-10T07:00:00+05:45",
    "fare": "1500.00",
    "total_seats": 40,
    "booked_seats": [1, 7, 12]
  }
]
```

### `POST /api/bookings/`

Books one seat on one route.

```json
{
  "route": 1,
  "seat_number": 5,
  "passenger_name": "Sita Sharma",
  "phone": "9812345678"
}
```

| Status | Meaning |
|--------|---------|
| `201 Created` | Booking saved successfully |
| `400 Bad Request` | Invalid data, seat out of range, or seat already taken |
| `404 Not Found` | The route does not exist |
| `409 Conflict` | Seat was taken by someone else at the same moment |

Example error response:

```json
{
  "seat_number": ["Sorry, seat 5 is already taken. Please choose another seat."]
}
```

## 💰 Fare Display

When a passenger selects a route and a seat, the booking summary shows:

```
Fare = Route fare in NPR (per seat)
```

> **Note:** Online payment is not part of this project yet. The system focuses on seat reservation and data safety.

## 🌟 Key Features

- Responsive Layout
- Modern Gradient Design
- Live Route Loading from Django
- 40-Seat Interactive Grid
- Gray, Unclickable Taken Seats
- Live Booking Summary
- Phone Number Validation
- Friendly Error Messages
- Transaction-Safe Booking
- Row Locking with `select_for_update()`
- Database-Level Duplicate Protection
- Django Admin Management
- CORS Protection
- Lightweight and Framework-Free Frontend

## 📱 Responsive Design

Nepal Bus Tickets is optimized for:

- 💻 Desktop
- 🖥️ Laptop
- 📱 Mobile
- 📲 Tablet

On smaller screens the two-column layout stacks into a single column.

## 🧪 Try It Yourself

1. Select a route, click a seat, fill in the form, and submit. The seat turns gray.
2. Refresh the page. The seat stays gray because it is stored in PostgreSQL.
3. Open the page in two tabs, select the same seat in both, and submit in both. The second tab gets a "seat is already taken" error.
4. Check the **Booking** table in the Django admin to see the saved data.

## 🔮 Future Enhancements

- Secure User Authentication (JWT)
- "My Bookings" History Page
- Booking Cancellation
- Search and Filter Routes by Origin, Destination, and Date
- Real eSewa Payment Gateway Integration
- Real Khalti Payment Gateway Integration
- Email and SMS Confirmation
- Ticket Download (PDF)
- Admin Dashboard
- Automated Tests for Validation and Concurrent Booking
- Environment Variables for `SECRET_KEY` and Database Credentials
- Docker Setup and Deployment

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository.
2. Create a new feature branch.
3. Make your changes.
4. Commit your changes.
5. Push to your branch.
6. Open a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Aayush**

Backend Developer | Django Enthusiast | Problem Solver

## ⭐ Show Your Support

If you like this project, consider giving it a ⭐ Star on GitHub.

It helps others discover the project and motivates future improvements.
