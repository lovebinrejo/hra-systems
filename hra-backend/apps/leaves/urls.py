from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LeaveTypeViewSet, HolidayViewSet, LeaveRequestViewSet, MyLeaveStatsView

app_name = 'leaves'

router = DefaultRouter()
router.register(r'types', LeaveTypeViewSet, basename='leave-type')
router.register(r'holidays', HolidayViewSet, basename='holiday')
router.register(r'requests', LeaveRequestViewSet, basename='leave-request')

urlpatterns = [
    path('my-stats/', MyLeaveStatsView.as_view(), name='my-stats'),
    path('', include(router.urls)),
]
