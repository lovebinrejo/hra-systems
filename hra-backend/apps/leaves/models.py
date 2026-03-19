from django.db import models
from utils.mixins import TimestampMixin


class LeaveType(TimestampMixin, models.Model):
    LEAVE_NAME_CHOICES = [
        ('paid', 'Paid Leave'),
        ('unpaid', 'Unpaid Leave'),
        ('sick', 'Sick Leave'),
        ('casual', 'Casual Leave'),
        ('maternity', 'Maternity Leave'),
        ('paternity', 'Paternity Leave'),
    ]
    name = models.CharField(max_length=50, choices=LEAVE_NAME_CHOICES, unique=True)
    display_name = models.CharField(max_length=100)
    yearly_quota = models.IntegerField(default=0)
    description = models.TextField(blank=True)
    is_paid = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'leaves_leave_type'
        ordering = ['name']

    def __str__(self):
        return self.display_name


class Holiday(TimestampMixin, models.Model):
    name = models.CharField(max_length=200)
    date = models.DateField(unique=True)
    description = models.TextField(blank=True)
    is_public = models.BooleanField(default=True)
    is_optional = models.BooleanField(default=False)

    class Meta:
        db_table = 'leaves_holiday'
        ordering = ['date']

    def __str__(self):
        return f"{self.name} ({self.date})"


class LeaveRequest(TimestampMixin, models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    ]
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='leave_requests')
    leave_type = models.ForeignKey(LeaveType, on_delete=models.PROTECT, related_name='requests')
    start_date = models.DateField()
    end_date = models.DateField()
    total_days = models.IntegerField(default=1)
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reviewed_by = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='reviewed_leaves',
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)

    class Meta:
        db_table = 'leaves_leave_request'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.full_name} - {self.leave_type.display_name} ({self.start_date} to {self.end_date})"
