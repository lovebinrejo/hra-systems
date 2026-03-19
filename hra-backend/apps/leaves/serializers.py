from rest_framework import serializers
from apps.accounts.serializers import UserSerializer
from .models import LeaveType, Holiday, LeaveRequest
from .utils import calculate_leave_days


class LeaveTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveType
        fields = ['id', 'name', 'display_name', 'yearly_quota', 'description', 'is_paid', 'is_active']


class HolidaySerializer(serializers.ModelSerializer):
    class Meta:
        model = Holiday
        fields = ['id', 'name', 'date', 'description', 'is_public', 'is_optional']


class LeaveRequestSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    leave_type = LeaveTypeSerializer(read_only=True)
    reviewed_by = serializers.SerializerMethodField()

    class Meta:
        model = LeaveRequest
        fields = [
            'id', 'user', 'leave_type', 'start_date', 'end_date', 'total_days',
            'reason', 'status', 'reviewed_by', 'reviewed_at', 'rejection_reason',
            'created_at', 'updated_at',
        ]

    def get_reviewed_by(self, obj):
        if obj.reviewed_by:
            return {'id': obj.reviewed_by.id, 'full_name': obj.reviewed_by.full_name}
        return None


class LeaveRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveRequest
        fields = ['leave_type', 'start_date', 'end_date', 'reason']

    def validate(self, attrs):
        start = attrs['start_date']
        end = attrs['end_date']
        if start > end:
            raise serializers.ValidationError({"end_date": "End date must be after or equal to start date."})

        days = calculate_leave_days(start, end)
        if days == 0:
            raise serializers.ValidationError("Selected dates fall only on weekends.")

        user = self.context['request'].user
        leave_type = attrs['leave_type']

        # Check for overlapping pending/approved leaves
        overlap = LeaveRequest.objects.filter(
            user=user,
            status__in=['pending', 'approved'],
            start_date__lte=end,
            end_date__gte=start,
        ).exists()
        if overlap:
            raise serializers.ValidationError("You already have a leave request for overlapping dates.")

        from .utils import check_leave_balance
        has_balance, available = check_leave_balance(user, leave_type.name, days)
        if not has_balance and leave_type.name != 'unpaid':
            raise serializers.ValidationError(
                f"Insufficient {leave_type.display_name} balance. Available: {available} day(s), Requested: {days} day(s)."
            )

        attrs['total_days'] = days
        return attrs

    def create(self, validated_data):
        user = self.context['request'].user
        return LeaveRequest.objects.create(user=user, **validated_data)


class LeaveApprovalSerializer(serializers.Serializer):
    rejection_reason = serializers.CharField(required=False, allow_blank=True)
