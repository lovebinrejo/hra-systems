from rest_framework import serializers
from .models import Attendance


class AttendanceSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    user_email = serializers.SerializerMethodField()
    user_department = serializers.SerializerMethodField()

    class Meta:
        model = Attendance
        fields = [
            'id', 'user', 'user_name', 'user_email', 'user_department',
            'date', 'check_in_time', 'check_out_time',
            'check_in_location', 'check_out_location', 'check_in_distance_km',
            'sessions', 'status', 'is_late', 'work_hours', 'notes', 'created_at',
        ]
        read_only_fields = ['id', 'user', 'is_late', 'work_hours', 'created_at']

    def get_user_name(self, obj):
        return obj.user.full_name

    def get_user_email(self, obj):
        return obj.user.email

    def get_user_department(self, obj):
        return obj.user.department


class AttendanceListSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    user_email = serializers.SerializerMethodField()

    class Meta:
        model = Attendance
        fields = [
            'id', 'user', 'user_name', 'user_email', 'date',
            'check_in_time', 'check_out_time',
            'check_in_location', 'check_out_location', 'check_in_distance_km',
            'status', 'is_late', 'work_hours',
        ]

    def get_user_name(self, obj):
        return obj.user.full_name

    def get_user_email(self, obj):
        return obj.user.email


class CheckInSerializer(serializers.Serializer):
    lat = serializers.FloatField()
    lng = serializers.FloatField()
    notes = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_lat(self, value):
        if not (-90 <= value <= 90):
            raise serializers.ValidationError("Latitude must be between -90 and 90.")
        return value

    def validate_lng(self, value):
        if not (-180 <= value <= 180):
            raise serializers.ValidationError("Longitude must be between -180 and 180.")
        return value


class CheckOutSerializer(serializers.Serializer):
    lat = serializers.FloatField(required=False)
    lng = serializers.FloatField(required=False)
    notes = serializers.CharField(required=False, allow_blank=True, default='')
