from rest_framework.permissions import BasePermission


class IsStudent(BasePermission):
    """
    Allows access only to users with the STUDENT role.
    Usage: permission_classes = [IsAuthenticated, IsStudent]
    """
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == 'STUDENT'
        )


class IsAdmin(BasePermission):
    """
    Allows access only to users with the ADMIN role.
    Usage: permission_classes = [IsAuthenticated, IsAdmin]
    """
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            (request.user.role == 'ADMIN' or request.user.is_staff)
        )