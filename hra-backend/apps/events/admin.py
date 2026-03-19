from django.contrib import admin
from .models import Event, Announcement


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ['title', 'event_date', 'event_time', 'location', 'is_published', 'created_by']
    list_filter = ['is_published', 'event_date']
    search_fields = ['title', 'content', 'location']
    date_hierarchy = 'event_date'


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ['title', 'priority', 'is_published', 'published_at', 'expires_at', 'created_by']
    list_filter = ['priority', 'is_published']
    search_fields = ['title', 'content']
