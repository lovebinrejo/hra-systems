from datetime import date, timedelta
from django.utils import timezone


def calculate_leave_days(start_date: date, end_date: date, exclude_weekends: bool = True) -> int:
    """Return number of working days between start_date and end_date (inclusive)."""
    if start_date > end_date:
        return 0
    total = 0
    current = start_date
    while current <= end_date:
        if exclude_weekends and current.weekday() >= 5:  # Sat=5, Sun=6
            pass
        else:
            total += 1
        current += timedelta(days=1)
    return total


def check_leave_balance(user, leave_type_name: str, requested_days: int) -> tuple[bool, int]:
    """
    Returns (has_balance, available_days).
    has_balance is True if user has enough balance for requested_days.
    """
    from apps.employees.models import LeaveBalance
    year = timezone.now().year
    try:
        lb = LeaveBalance.objects.get(user=user, year=year)
    except LeaveBalance.DoesNotExist:
        return False, 0

    balance_map = {
        'paid': lb.paid_leaves_remaining,
        'unpaid': lb.unpaid_leaves_remaining,
        'sick': lb.sick_leaves_remaining,
        'casual': lb.casual_leaves_remaining,
    }
    available = balance_map.get(leave_type_name, 0)
    return available >= requested_days, available


def deduct_leave_balance(user, leave_type_name: str, days: int) -> bool:
    """Deduct days from the user's leave balance. Returns True on success."""
    from apps.employees.models import LeaveBalance
    year = timezone.now().year
    try:
        lb = LeaveBalance.objects.get(user=user, year=year)
    except LeaveBalance.DoesNotExist:
        return False

    field_map = {
        'paid': 'paid_leaves_used',
        'unpaid': 'unpaid_leaves_used',
        'sick': 'sick_leaves_used',
        'casual': 'casual_leaves_used',
    }
    field = field_map.get(leave_type_name)
    if not field:
        return False
    current = getattr(lb, field)
    setattr(lb, field, current + days)
    lb.save(update_fields=[field])
    return True


def restore_leave_balance(user, leave_type_name: str, days: int) -> bool:
    """Restore days to user's leave balance on rejection/cancellation."""
    from apps.employees.models import LeaveBalance
    year = timezone.now().year
    try:
        lb = LeaveBalance.objects.get(user=user, year=year)
    except LeaveBalance.DoesNotExist:
        return False

    field_map = {
        'paid': ('paid_leaves_used', 'paid_leaves_total'),
        'unpaid': ('unpaid_leaves_used', 'unpaid_leaves_total'),
        'sick': ('sick_leaves_used', 'sick_leaves_total'),
        'casual': ('casual_leaves_used', 'casual_leaves_total'),
    }
    fields = field_map.get(leave_type_name)
    if not fields:
        return False
    used_field, total_field = fields
    current_used = getattr(lb, used_field)
    setattr(lb, used_field, max(0, current_used - days))
    lb.save(update_fields=[used_field])
    return True
