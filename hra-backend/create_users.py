import django
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')
django.setup()

from apps.accounts.models import User

if not User.objects.filter(email='admin@statech.com').exists():
    User.objects.create_superuser(
        username='admin_sta',
        email='admin@statech.com',
        password='Admin@1234',
        first_name='Admin',
        last_name='STA',
        role='admin'
    )
    print('Admin created!')
else:
    print('Admin already exists')

if not User.objects.filter(email='rejo@statech.com').exists():
    User.objects.create_user(
        username='rejo',
        email='rejo@statech.com',
        password='Rejo@123',
        first_name='Rejo',
        last_name='',
        role='employee'
    )
    print('Staff created!')
else:
    print('Staff already exists')
