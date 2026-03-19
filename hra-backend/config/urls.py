"""
Root URL configuration.
All API routes are versioned under /api/v1/
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse


def health_check(request):
    return JsonResponse({'status': 'ok', 'version': 'v1'})


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/health/', health_check, name='health-check'),

    # Auth (login, logout, token refresh, password reset)
    path('api/v1/auth/', include('apps.accounts.urls', namespace='accounts')),

    # Employee CRUD (Admin-managed)
    path('api/v1/employees/', include('apps.employees.urls', namespace='employees')),

    # Leave management
    path('api/v1/leaves/', include('apps.leaves.urls', namespace='leaves')),

    # Attendance (check-in/out + reports)
    path('api/v1/attendance/', include('apps.attendance.urls', namespace='attendance')),

    # Payslips
    path('api/v1/payslips/', include('apps.payslips.urls', namespace='payslips')),

    # Events & Holidays
    path('api/v1/events/', include('apps.events.urls', namespace='events')),

    # Notifications
    path('api/v1/notifications/', include('apps.notifications.urls', namespace='notifications')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

    import debug_toolbar
    urlpatterns = [path('__debug__/', include(debug_toolbar.urls))] + urlpatterns

# Customize admin site
admin.site.site_header = 'STA Technologies — HRA Administration'
admin.site.site_title = 'STA HRA Admin'
admin.site.index_title = 'STA Technologies Human Resource Administration'
