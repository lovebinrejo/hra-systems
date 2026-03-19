from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EventViewSet, AnnouncementViewSet

app_name = 'events'

router = DefaultRouter()
router.register(r'events', EventViewSet, basename='event')
router.register(r'announcements', AnnouncementViewSet, basename='announcement')

urlpatterns = [
    path('', include(router.urls)),
]
