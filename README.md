# E-Cycle Connect

A responsive e-waste collection and reuse website prototype with customer and admin demo sign-ins.

## Run locally

No build step or package installation is required.

1. Open `index.html` in a browser, or open the project folder in VS Code and use the Live Server extension.
2. Alternatively, if Python is installed, run `python -m http.server 8000` from this folder and visit `http://localhost:8000`.

## Demo accounts

Use the **Sign in** button in the header:

| Role | Email | Password |
| --- | --- | --- |
| Customer | `customer@ecycleconnect.demo` | `customer123` |
| Admin | `admin@ecycleconnect.demo` | `admin123` |

Customers can book pickups and track their items. Admins can update collection, inspection, reuse, repair, recycling, and completion statuses. Eligible completed bookings add reward points.

## Project structure

```text
index.html
assets/
  css/
    styles.css
  js/
    app.js
```

Bookings, demo sign-in state, and reward points are stored in the current browser using `localStorage`. This is a front-end demonstration, not production authentication or a shared database. Do not use real passwords or personal data. A live deployment needs a backend for authentication, role enforcement, bookings, and customer data.

