from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EmployeeViewSet, CurrentUserLeaveBalanceView

app_name = 'employees'

router = DefaultRouter()
router.register(r'', EmployeeViewSet, basename='employee')

urlpatterns = [
    path('my-leave-balance/', CurrentUserLeaveBalanceView.as_view(), name='my-leave-balance'),
    path('', include(router.urls)),
]
