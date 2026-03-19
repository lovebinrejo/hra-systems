from rest_framework import serializers
from .models import Event, Announcement


class EventSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'content', 'event_date', 'event_time',
            'location', 'is_published', 'banner_image', 'created_by_name',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by_name']

    def get_created_by_name(self, obj):
        return obj.created_by.full_name if obj.created_by else None


class AnnouncementListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Announcement
        fields = ['id', 'title', 'priority', 'is_published', 'published_at', 'expires_at', 'created_at']


class AnnouncementSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Announcement
        fields = [
            'id', 'title', 'content', 'priority', 'is_published',
            'published_at', 'expires_at', 'target_departments',
            'created_by_name', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by_name']

    def get_created_by_name(self, obj):
        return obj.created_by.full_name if obj.created_by else None
