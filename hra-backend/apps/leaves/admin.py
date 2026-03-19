from django.contrib import admin
from .models import LeaveType, Holiday, LeaveRequest


@admin.register(LeaveType)
class LeaveTypeAdmin(admin.ModelAdmin):
    list_display = ['name', 'display_name', 'yearly_quota', 'is_paid', 'is_active']
    list_filter = ['is_paid', 'is_active']


@admin.register(Holiday)
class HolidayAdmin(admin.ModelAdmin):
    list_display = ['name', 'date', 'is_public', 'is_optional']
    list_filter = ['is_public', 'is_optional']
    ordering = ['date']


@admin.register(LeaveRequest)
class LeaveRequestAdmin(admin.ModelAdmin):
    list_display = ['user', 'leave_type', 'start_date', 'end_date', 'total_days', 'status', 'created_at']
    list_filter = ['status', 'leave_type']
    search_fields = ['user__email', 'user__first_name', 'user__last_name']
    raw_id_fields = ['user', 'reviewed_by']
    readonly_fields = ['created_at', 'updated_at']
