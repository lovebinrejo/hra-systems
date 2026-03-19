from django.db import models
from utils.mixins import TimestampMixin


class LeaveBalance(TimestampMixin, models.Model):
    """Tracks leave quota and usage per user per year."""
    user = models.OneToOneField(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='leave_balance',
    )
    paid_leaves_total = models.IntegerField(default=20)
    paid_leaves_used = models.IntegerField(default=0)
    unpaid_leaves_total = models.IntegerField(default=10)
    unpaid_leaves_used = models.IntegerField(default=0)
    sick_leaves_total = models.IntegerField(default=10)
    sick_leaves_used = models.IntegerField(default=0)
    casual_leaves_total = models.IntegerField(default=8)
    casual_leaves_used = models.IntegerField(default=0)
    year = models.IntegerField()

    class Meta:
        db_table = 'employees_leave_balance'
        unique_together = ['user', 'year']
        ordering = ['-year']

    @property
    def paid_leaves_remaining(self):
        return max(0, self.paid_leaves_total - self.paid_leaves_used)

    @property
    def unpaid_leaves_remaining(self):
        return max(0, self.unpaid_leaves_total - self.unpaid_leaves_used)

    @property
    def sick_leaves_remaining(self):
        return max(0, self.sick_leaves_total - self.sick_leaves_used)

    @property
    def casual_leaves_remaining(self):
        return max(0, self.casual_leaves_total - self.casual_leaves_used)

    def __str__(self):
        return f"LeaveBalance({self.user.email}, {self.year})"
