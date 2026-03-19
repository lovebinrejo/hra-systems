from config.celery import app
from django.utils import timezone


@app.task(name='apps.attendance.tasks.auto_mark_absent')
def auto_mark_absent():
    """Mark all active employees who haven't checked in today as absent."""
    from apps.accounts.models import User
    from apps.attendance.models import Attendance
    from apps.leaves.models import LeaveRequest

    today = timezone.localdate()
    # Skip weekends
    if today.weekday() >= 5:
        return f"Weekend - skipped for {today}"

    active_users = User.objects.filter(is_active=True, role='employee')
    marked = 0
    for user in active_users:
        # Skip if already on approved leave
        on_leave = LeaveRequest.objects.filter(
            user=user,
            status='approved',
            start_date__lte=today,
            end_date__gte=today,
        ).exists()
        if on_leave:
            Attendance.objects.get_or_create(user=user, date=today, defaults={'status': 'on_leave'})
            continue

        _, created = Attendance.objects.get_or_create(
            user=user,
            date=today,
            defaults={'status': 'absent'},
        )
        if created:
            marked += 1

    return f"Auto-marked {marked} employees as absent for {today}"


@app.task(name='apps.attendance.tasks.send_late_checkin_alert')
def send_late_checkin_alert():
    """Send alert notifications to employees who checked in late."""
    from apps.attendance.models import Attendance
    from apps.notifications.utils import create_notification

    today = timezone.localdate()
    late_records = Attendance.objects.filter(date=today, is_late=True).select_related('user')
    for record in late_records:
        create_notification(
            recipient=record.user,
            title='Late Arrival Notice',
            message=f'You checked in at {record.check_in_time}. Please ensure timely attendance.',
            notification_type='attendance_alert',
            action_url='/attendance',
        )
    return f"Sent late arrival alerts to {late_records.count()} employees"
