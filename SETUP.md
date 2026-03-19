# HRA System - Quick Start Guide

## Prerequisites
- Python 3.12+
- Node.js 20+
- PostgreSQL 15+
- Redis (optional, for Celery tasks)

---

## Backend Setup

```bash
cd hra-backend

# 1. Create virtual environment
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements/local.txt

# 3. Create PostgreSQL database
# In psql:
# CREATE DATABASE hra_db;
# CREATE USER hra_user WITH PASSWORD 'hradbpassword123';
# GRANT ALL PRIVILEGES ON DATABASE hra_db TO hra_user;

# 4. Copy .env (already created)
# Edit hra-backend/.env if needed

# 5. Run migrations
python manage.py migrate

# 6. Create initial leave types (run in Django shell)
python manage.py shell -c "
from apps.leaves.models import LeaveType
types = [
    ('paid', 'Paid Leave', 20, True),
    ('unpaid', 'Unpaid Leave', 10, False),
    ('sick', 'Sick Leave', 10, True),
    ('casual', 'Casual Leave', 8, True),
]
for name, display, quota, paid in types:
    LeaveType.objects.get_or_create(name=name, defaults={'display_name': display, 'yearly_quota': quota, 'is_paid': paid})
print('Leave types created!')
"

# 7. Start server
python manage.py runserver
# Backend runs at: http://localhost:8000
# Admin panel: http://localhost:8000/admin/
```

---

## Frontend Setup

```bash
cd hra-frontend

# 1. Install dependencies
npm install

# 2. Start dev server
npm run dev
# Frontend runs at: http://localhost:3000
```

---

## First Time Use

1. Open http://localhost:3000
2. Click "Create admin account"
3. Fill in admin details → creates superuser
4. Login with admin credentials
5. Go to **Employees** → Add employees
6. Employees receive credentials and can log in

---

## API Endpoints Reference

| Endpoint | Description |
|---|---|
| POST /api/v1/auth/login/ | Login |
| POST /api/v1/auth/register-admin/ | Create first admin |
| POST /api/v1/auth/password-reset/ | Request password reset |
| GET /api/v1/auth/me/ | Current user profile |
| GET /api/v1/employees/ | List employees (admin) |
| POST /api/v1/employees/ | Create employee (admin) |
| GET /api/v1/leaves/requests/ | Leave requests |
| POST /api/v1/attendance/check-in/ | Check in with geolocation |
| POST /api/v1/attendance/check-out/ | Check out |
| POST /api/v1/payslips/generate/ | Generate payslip (admin) |
| GET /api/v1/payslips/{id}/download/ | Download payslip PDF |

---

## Docker (Full Stack)

```bash
cd hra-system
docker compose up --build
```

Services:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Admin: http://localhost:8000/admin/
- PostgreSQL: localhost:5432
- Redis: localhost:6379

---

## Geolocation Settings

Edit `.env`:
```
OFFICE_LATITUDE=13.0827    # Your office latitude
OFFICE_LONGITUDE=80.2707   # Your office longitude
OFFICE_RADIUS_KM=0.5       # Allowed radius in km (currently 50km for dev)
```

For production, set `OFFICE_RADIUS_KM=0.5` (500m from office).
