from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CheckInView, CheckOutView, TodayAttendanceView, AttendanceViewSet

app_name = 'attendance'

router = DefaultRouter()
router.register(r'records', AttendanceViewSet, basename='attendance')

urlpatterns = [
    path('check-in/', CheckInView.as_view(), name='check-in'),
    path('check-out/', CheckOutView.as_view(), name='check-out'),
    path('today/', TodayAttendanceView.as_view(), name='today'),
    path('', include(router.urls)),
]
