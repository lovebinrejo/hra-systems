from config.celery import app
from django.utils import timezone


@app.task(name='apps.payslips.tasks.generate_monthly_payslips')
def generate_monthly_payslips():
    """Generate payslips for all active employees for the previous month."""
    from apps.accounts.models import User
    from apps.payslips.views import _build_payslip_for_user

    today = timezone.localdate()
    # Use previous month
    if today.month == 1:
        month, year = 12, today.year - 1
    else:
        month, year = today.month - 1, today.year

    employees = User.objects.filter(is_active=True, role='employee', salary__gt=0)
    generated = 0
    failed = 0
    for emp in employees:
        try:
            _build_payslip_for_user(emp, month, year)
            generated += 1
        except Exception:
            failed += 1

    return f"Generated {generated} payslips for {month}/{year}, {failed} failed."
