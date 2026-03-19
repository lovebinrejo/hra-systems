"""
Celery application entry point.
"""
import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.local')

app = Celery('hra')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# ─── Periodic task schedule ───────────────────────────────────────────────────
app.conf.beat_schedule = {
    # Mark absent employees daily at 9:05 AM
    'auto-mark-absent': {
        'task': 'apps.attendance.tasks.auto_mark_absent',
        'schedule': crontab(hour=9, minute=5),
    },
    # Send late check-in alerts at 10:00 AM
    'late-checkin-alert': {
        'task': 'apps.attendance.tasks.send_late_checkin_alert',
        'schedule': crontab(hour=10, minute=0),
    },
    # Generate monthly payslips on the 1st of each month
    'generate-monthly-payslips': {
        'task': 'apps.payslips.tasks.batch_generate_payslips',
        'schedule': crontab(day_of_month=1, hour=1, minute=0),
    },
    # Send leave balance reminder every Friday
    'leave-balance-reminder': {
        'task': 'apps.leaves.tasks.send_leave_balance_reminder',
        'schedule': crontab(day_of_week=5, hour=17, minute=0),
    },
}
