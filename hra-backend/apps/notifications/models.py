from django.db import models
from utils.mixins import TimestampMixin


class Notification(TimestampMixin, models.Model):
    TYPE_CHOICES = [
        ('leave_applied', 'Leave Applied'),
        ('leave_approved', 'Leave Approved'),
        ('leave_rejected', 'Leave Rejected'),
        ('attendance_alert', 'Attendance Alert'),
        ('payslip_generated', 'Payslip Generated'),
        ('announcement', 'Announcement'),
        ('general', 'General'),
    ]

    recipient = models.ForeignKey(
        'accounts.User', on_delete=models.CASCADE,
        related_name='notifications',
    )
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=50, choices=TYPE_CHOICES, default='general')
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    action_url = models.CharField(max_length=500, blank=True)

    class Meta:
        db_table = 'notifications_notification'
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.notification_type}] {self.title} → {self.recipient.email}"
