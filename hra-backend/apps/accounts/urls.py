from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    LoginView, LogoutView, RegisterAdminView,
    PasswordResetRequestView, PasswordResetConfirmView,
    ChangePasswordView, UserMeView, ProfilePhotoUploadView,
    RequestAdminPasswordResetView, AdminPasswordResetRequestsView, AdminResolvePasswordResetView,
)

app_name = 'accounts'

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('register-admin/', RegisterAdminView.as_view(), name='register-admin'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('me/', UserMeView.as_view(), name='me'),
    path('me/photo/', ProfilePhotoUploadView.as_view(), name='me-photo'),
    path('request-admin-reset/', RequestAdminPasswordResetView.as_view(), name='request-admin-reset'),
    path('admin-reset-requests/', AdminPasswordResetRequestsView.as_view(), name='admin-reset-requests'),
    path('admin-reset-requests/<int:pk>/resolve/', AdminResolvePasswordResetView.as_view(), name='admin-reset-resolve'),
]
