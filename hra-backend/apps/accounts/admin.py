from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, PasswordResetToken


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'full_name', 'employee_id', 'department', 'role', 'is_active', 'date_joined']
    list_filter = ['role', 'department', 'is_active', 'is_superuser']
    search_fields = ['email', 'first_name', 'last_name', 'employee_id']
    ordering = ['-date_joined']

    fieldsets = BaseUserAdmin.fieldsets + (
        ('HRA Profile', {
            'fields': (
                'role', 'profile_photo', 'department', 'designation',
                'employee_id', 'phone', 'date_of_birth', 'join_date',
                'salary', 'address',
            ),
        }),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('HRA Profile', {
            'fields': (
                'email', 'role', 'department', 'designation',
                'employee_id', 'phone', 'join_date', 'salary',
            ),
        }),
    )


@admin.register(PasswordResetToken)
class PasswordResetTokenAdmin(admin.ModelAdmin):
    list_display = ['user', 'created_at', 'expires_at', 'is_used']
    list_filter = ['is_used']
    search_fields = ['user__email']
    readonly_fields = ['token', 'created_at']
