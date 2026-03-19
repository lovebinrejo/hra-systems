from django.contrib import admin
from .models import Payslip


@admin.register(Payslip)
class PayslipAdmin(admin.ModelAdmin):
    list_display = ['user', 'month', 'year', 'basic_salary', 'net_salary', 'status', 'generated_at']
    list_filter = ['status', 'year', 'month']
    search_fields = ['user__email', 'user__first_name', 'user__last_name']
    raw_id_fields = ['user']
    readonly_fields = ['created_at', 'updated_at', 'gross_salary', 'net_salary', 'generated_at']
