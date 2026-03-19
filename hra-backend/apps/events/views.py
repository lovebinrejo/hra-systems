from datetime import timedelta
from django.db.models import Q
from django.utils import timezone
from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import Event, Announcement
from .serializers import EventSerializer, AnnouncementSerializer, AnnouncementListSerializer
from utils.permissions import IsAdminOrReadOnly


class EventViewSet(viewsets.ModelViewSet):
    serializer_class = EventSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_published']
    search_fields = ['title', 'content', 'location']
    ordering_fields = ['event_date', 'created_at']
    ordering = ['-event_date']

    def get_queryset(self):
        qs = Event.objects.all()
        start = self.request.query_params.get('start_date')
        end = self.request.query_params.get('end_date')
        if start:
            qs = qs.filter(event_date__gte=start)
        if end:
            qs = qs.filter(event_date__lte=end)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        today = timezone.localdate()
        events = Event.objects.filter(
            event_date__gte=today,
            event_date__lte=today + timedelta(days=30),
            is_published=True,
        ).order_by('event_date')
        return Response(EventSerializer(events, many=True).data)


class AnnouncementViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['priority', 'is_published']
    search_fields = ['title', 'content']
    ordering_fields = ['created_at', 'priority']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return AnnouncementListSerializer
        return AnnouncementSerializer

    def get_queryset(self):
        qs = Announcement.objects.all()
        # Non-admins only see active, non-expired announcements
        if not (self.request.user.is_authenticated and self.request.user.is_admin_user):
            today = timezone.localdate()
            qs = qs.filter(is_published=True).filter(
                Q(expires_at__isnull=True) | Q(expires_at__gte=today)
            )
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, published_at=timezone.now())
