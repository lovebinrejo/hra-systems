from django.db import models
from utils.mixins import TimestampMixin


class Attendance(TimestampMixin, models.Model):
    STATUS_CHOICES = [
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('half_day', 'Half Day'),
        ('on_leave', 'On Leave'),
        ('holiday', 'Holiday'),
        ('weekend', 'Weekend'),
    ]

    user = models.ForeignKey(
        'accounts.User', on_delete=models.CASCADE,
        related_name='attendance_records',
    )
    date = models.DateField()
    check_in_time = models.TimeField(null=True, blank=True)
    check_out_time = models.TimeField(null=True, blank=True)
    check_in_location = models.JSONField(null=True, blank=True)   # {'lat': float, 'lng': float}
    check_out_location = models.JSONField(null=True, blank=True)
    check_in_distance_km = models.FloatField(null=True, blank=True)
    # Multiple check-in/out sessions per day
    # Each: {check_in_time, check_out_time, check_in_location, check_out_location, distance_km, hours}
    sessions = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='present')
    notes = models.TextField(blank=True)
    is_late = models.BooleanField(default=False)
    work_hours = models.FloatField(null=True, blank=True)

    class Meta:
        db_table = 'attendance_attendance'
        unique_together = ['user', 'date']
        ordering = ['-date']

    def __str__(self):
        return f"{self.user.full_name} - {self.date} ({self.status})"
