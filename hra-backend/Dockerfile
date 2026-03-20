FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc && \
    rm -rf /var/lib/apt/lists/*

COPY requirements/ requirements/
RUN pip install --no-cache-dir -r requirements/production.txt

COPY . .

RUN mkdir -p media staticfiles static

EXPOSE 8000

CMD ["sh", "-c", "python manage.py migrate && python manage.py collectstatic --noinput && python manage.py shell -c \"from apps.accounts.models import User; User.objects.filter(email='admin@statech.com').exists() or User.objects.create_superuser(username='admin_sta', email='admin@statech.com', password='Admin@1234', first_name='Admin', last_name='STA', role='admin'); User.objects.filter(email='rejo@statech.com').exists() or User.objects.create_user(username='rejo', email='rejo@statech.com', password='Rejo@123', first_name='Rejo', last_name='', role='employee'); print('Users ready')\" && gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 2 --timeout 120"]
