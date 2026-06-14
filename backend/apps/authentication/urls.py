from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView,
    UserProfileView,
    LogoutView,
    GoogleLoginView,
    HealthCheckView,
    RateLimitedLoginView,
    PasswordChangeView,
    AccountDeleteView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', RateLimitedLoginView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', UserProfileView.as_view(), name='profile'),
    path('me/delete/', AccountDeleteView.as_view(), name='account_delete'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('google/', GoogleLoginView.as_view(), name='google_login'),
    path('password/change/', PasswordChangeView.as_view(), name='password_change'),
    path('health/', HealthCheckView.as_view(), name='health_check'),
]