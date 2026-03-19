from django.db import models
from utils.mixins import TimestampMixin


class Event(TimestampMixin, models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    event_date = models.DateField()
    event_time = models.TimeField(null=True, blank=True)
    location = models.CharField(max_length=200, blank=True)
    is_published = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL,
        null=True, related_name='created_events',
    )
    banner_image = models.ImageField(upload_to='events/', null=True, blank=True)

    class Meta:
        db_table = 'events_event'
        ordering = ['-event_date']

    def __str__(self):
        return f"{self.title} ({self.event_date})"


class Announcement(TimestampMixin, models.Model):
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    title = models.CharField(max_length=200)
    content = models.TextField()
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    is_published = models.BooleanField(default=True)
    published_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateField(null=True, blank=True)
    created_by = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL,
        null=True, related_name='created_announcements',
    )
    target_departments = models.JSONField(default=list, blank=True)  # empty = all departments

    class Meta:
        db_table = 'events_announcement'
        ordering = ['-created_at']

    def __str__(self):
        return self.title
