from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone


@receiver(post_save, sender='accounts.User')
def create_leave_balance(sender, instance, created, **kwargs):
    """Auto-create LeaveBalance for current year when a new user is created."""
    if created:
        from apps.employees.models import LeaveBalance
        current_year = timezone.now().year
        LeaveBalance.objects.get_or_create(
            user=instance,
            year=current_year,
            defaults={
                'paid_leaves_total': 20,
                'unpaid_leaves_total': 10,
                'sick_leaves_total': 10,
                'casual_leaves_total': 8,
            }
        )
