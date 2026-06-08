from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from apps.authentication.views import HealthCheckView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.authentication.urls')),
    path('api/resume/', include('apps.resume.urls')),
    path('api/roadmap/', include('apps.roadmap.urls')),
    path('api/rag/', include('apps.rag.urls')),
    path('api/health/', HealthCheckView.as_view(), name='health'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)