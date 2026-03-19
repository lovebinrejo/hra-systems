from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdminUser(BasePermission):
    """Allow access only to admin users (role='admin' or is_superuser)."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.is_admin_user if hasattr(request.user, 'is_admin_user') else request.user.is_superuser)
        )


class IsOwnerOrAdmin(BasePermission):
    """Allow object access if user owns it or is admin."""

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        if hasattr(request.user, 'is_admin_user') and request.user.is_admin_user:
            return True
        if request.user.is_superuser:
            return True
        if obj == request.user:
            return True
        if hasattr(obj, 'user') and obj.user == request.user:
            return True
        return False


class IsAdminOrReadOnly(BasePermission):
    """Admins can do anything; authenticated users can only read."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return True
        return hasattr(request.user, 'is_admin_user') and request.user.is_admin_user
