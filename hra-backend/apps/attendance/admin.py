from django.contrib import admin
from .models import Attendance


@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ['user', 'date', 'check_in_time', 'check_out_time', 'status', 'is_late', 'work_hours']
    list_filter = ['status', 'is_late', 'date']
    search_fields = ['user__email', 'user__first_name', 'user__last_name']
    raw_id_fields = ['user']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'date'
