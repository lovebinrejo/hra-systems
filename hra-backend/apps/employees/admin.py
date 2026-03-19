from django.contrib import admin
from .models import LeaveBalance


@admin.register(LeaveBalance)
class LeaveBalanceAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'year',
        'paid_leaves_total', 'paid_leaves_used',
        'sick_leaves_total', 'sick_leaves_used',
        'unpaid_leaves_total', 'unpaid_leaves_used',
    ]
    list_filter = ['year']
    search_fields = ['user__email', 'user__first_name', 'user__last_name']
    raw_id_fields = ['user']
