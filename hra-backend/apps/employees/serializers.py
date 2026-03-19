from rest_framework import serializers
from apps.accounts.models import User
from .models import LeaveBalance


class LeaveBalanceSerializer(serializers.ModelSerializer):
    paid_leaves_remaining = serializers.ReadOnlyField()
    unpaid_leaves_remaining = serializers.ReadOnlyField()
    sick_leaves_remaining = serializers.ReadOnlyField()
    casual_leaves_remaining = serializers.ReadOnlyField()

    class Meta:
        model = LeaveBalance
        fields = [
            'id', 'year',
            'paid_leaves_total', 'paid_leaves_used', 'paid_leaves_remaining',
            'unpaid_leaves_total', 'unpaid_leaves_used', 'unpaid_leaves_remaining',
            'sick_leaves_total', 'sick_leaves_used', 'sick_leaves_remaining',
            'casual_leaves_total', 'casual_leaves_used', 'casual_leaves_remaining',
        ]
        read_only_fields = [
            'id', 'paid_leaves_remaining', 'unpaid_leaves_remaining',
            'sick_leaves_remaining', 'casual_leaves_remaining',
        ]


class EmployeeListSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    profile_photo_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'full_name', 'first_name', 'last_name',
            'employee_id', 'department', 'designation', 'role',
            'is_active', 'join_date', 'profile_photo_url',
        ]

    def get_profile_photo_url(self, obj):
        if obj.profile_photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_photo.url)
            return obj.profile_photo.url
        return None


class EmployeeDetailSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    is_admin_user = serializers.ReadOnlyField()
    leave_balance = serializers.SerializerMethodField()
    profile_photo_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name', 'full_name',
            'role', 'is_admin_user', 'profile_photo', 'profile_photo_url',
            'department', 'designation', 'employee_id', 'phone',
            'date_of_birth', 'join_date', 'salary', 'address',
            'gender', 'marital_status',
            'is_active', 'date_joined', 'leave_balance',
        ]
        read_only_fields = ['id', 'date_joined', 'full_name', 'is_admin_user']

    def get_leave_balance(self, obj):
        from django.utils import timezone
        year = timezone.now().year
        try:
            lb = obj.leave_balance
            if lb.year == year:
                return LeaveBalanceSerializer(lb).data
        except LeaveBalance.DoesNotExist:
            pass
        return None

    def get_profile_photo_url(self, obj):
        if obj.profile_photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_photo.url)
            return obj.profile_photo.url
        return None


class LeaveBalanceUpdateSerializer(serializers.ModelSerializer):
    """Admin updates leave quotas for an employee."""
    class Meta:
        model = LeaveBalance
        fields = [
            'paid_leaves_total', 'unpaid_leaves_total',
            'sick_leaves_total', 'casual_leaves_total',
        ]
