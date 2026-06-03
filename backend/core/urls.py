from django.contrib import admin
from django.urls import path, include
from apps.authentication.views import HealthCheckView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.authentication.urls')),
    path('api/health/', HealthCheckView.as_view(), name='health'),
]