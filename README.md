# Hotel Management System

A simple, beginner-friendly full-stack web application with three modules: Admin, Employee, and Customer.

## Tech Stack
- **Backend:** Python, Django, Django REST Framework
- **Frontend:** React.js (Vite), Axios, Bootstrap
- **Database:** SQLite3

## Quick Start

### 1. Backend Setup
```bash
cd hotel_backend
pip install django djangorestframework django-cors-headers
python manage.py migrate
python manage.py create_demo_users
python manage.py runserver 8000
```

### 2. Frontend Setup (in a new terminal)
```bash
cd hotel_frontend
npm install
npm run dev
```

### 3. Open the App
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/api/

## Demo Login Credentials

| Role     | Username        | Password        |
|----------|-----------------|-----------------|
| Admin    | `admin_test`    | `Admin@12345`   |
| Employee | `employee_test` | `Employee@12345`|
| Customer | `user_test`     | `User@12345`    |

## Features

### Admin
- Dashboard with stats (rooms, bookings, revenue)
- Add/edit/delete rooms and room categories
- Create/manage employee accounts (activate/deactivate)
- View customers and all bookings
- Check-in and check-out guests
- View feedback and resolve complaints

### Employee
- Dashboard with today's check-ins/outs
- View room availability
- Register walk-in customers
- Create reservations for customers
- Search bookings
- Check-in / check-out guests
- View feedback and complaints

### Customer
- Self-registration
- Browse available rooms with date/category filters
- Book rooms
- View booking history (upcoming, current, completed, cancelled)
- Cancel bookings
- Update profile
- Submit feedback and complaints

## Project Structure
```
hotel_backend/
  api/
    models.py         - Database models
    views.py          - API views (function-based)
    serializers.py    - DRF serializers
    urls.py           - API routes
    management/commands/create_demo_users.py
  hotel_backend/
    settings.py       - Django config
    urls.py           - Root URL config

hotel_frontend/
  src/
    api.js            - Axios config
    App.jsx           - Main app with routing
    components/
      Navbar.jsx      - Navigation bar
      ProtectedRoute.jsx - Route guard
    pages/
      HomePage.jsx          - Home with login cards
      LoginPage.jsx         - Reusable login form
      RegisterPage.jsx      - Customer registration
      AdminDashboard.jsx    - Admin panel
      EmployeeDashboard.jsx - Employee panel
      CustomerDashboard.jsx - Customer panel
```
