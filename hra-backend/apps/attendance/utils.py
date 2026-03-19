from datetime import time


def calculate_work_hours(check_in_time: time, check_out_time: time) -> float:
    """Calculate hours worked between check_in and check_out times."""
    if not check_in_time or not check_out_time:
        return 0.0
    in_minutes = check_in_time.hour * 60 + check_in_time.minute
    out_minutes = check_out_time.hour * 60 + check_out_time.minute
    diff = out_minutes - in_minutes
    if diff < 0:  # crossed midnight
        diff += 24 * 60
    return round(diff / 60, 2)


def is_late_arrival(check_in_time: time, threshold_hour: int = 9, threshold_minute: int = 30) -> bool:
    """Return True if check_in_time is after the threshold."""
    threshold = time(threshold_hour, threshold_minute)
    return check_in_time > threshold
