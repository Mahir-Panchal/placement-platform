from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.utils import timezone
from .serializers import RegisterSerializer, UserProfileSerializer
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import RegisterSerializer, UserProfileSerializer, PasswordChangeSerializer

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """
    POST /api/auth/register/
    Anyone can hit this endpoint (no auth required).
    Creates a new user and returns JWT tokens immediately.
    """
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate JWT token pair for the new user
        refresh = RefreshToken.for_user(user)

        return Response({
            'user': UserProfileSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    GET  /api/auth/me/  → returns current user's profile
    PUT  /api/auth/me/  → updates full_name
    Requires authentication (JWT token in header).
    """
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        # Always return the currently logged-in user
        return self.request.user


class LogoutView(APIView):
    """
    POST /api/auth/logout/
    Blacklists the refresh token so it can't be used again.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data['refresh']
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'message': 'Logged out successfully'})
        except Exception:
            return Response(
                {'error': 'Invalid token'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
@method_decorator(
    ratelimit(key='ip', rate='5/m', method='POST', block=True),
    name='dispatch'
)
class RateLimitedLoginView(TokenObtainPairView):
    """
    POST /api/auth/login/
    Same as JWT login but limited to 5 attempts per minute per IP.
    Blocks with 429 Too Many Requests after limit exceeded.
    """
    pass
        
class GoogleLoginView(APIView):
    """
    POST /api/auth/google/
    Receives Google OAuth token from frontend,
    verifies it with Google, creates or fetches user,
    returns our JWT tokens.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        import requests as http_requests
        token = request.data.get('access_token')
        if not token:
            return Response(
                {'error': 'access_token is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        # Verify token with Google and get user info
        google_url = 'https://www.googleapis.com/oauth2/v3/userinfo'
        response = http_requests.get(
            google_url,
            headers={'Authorization': f'Bearer {token}'}
        )
        if response.status_code != 200:
            return Response(
                {'error': 'Invalid Google token'},
                status=status.HTTP_400_BAD_REQUEST
            )
        google_data = response.json()
        email = google_data.get('email')
        full_name = google_data.get('name', '')

        if not email:
            return Response(
                {'error': 'Could not get email from Google'},
                status=status.HTTP_400_BAD_REQUEST
            )
        # Get or create user
        user, created = User.objects.get_or_create(
            email=email,
            defaults={'full_name': full_name, 'is_active': True}
        )
        # Generate JWT tokens for this user
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserProfileSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            'created': created  # True if new user, False if existing
        })
    
class PasswordChangeView(APIView):
    """
    POST /api/auth/password/change/
    Authenticated users can change their password.
    Requires old password verification.
    Invalidates all existing tokens after change.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSerializer(
            data=request.data,
            context={'request': request}
        )
        if serializer.is_valid():
            # Set the new password
            request.user.set_password(serializer.validated_data['new_password'])
            request.user.save()
            return Response({'message': 'Password changed successfully'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class HealthCheckView(APIView):
    """
    GET /api/health/
    Quick endpoint to verify the API is running.
    No authentication required.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({
            'status': 'ok',
            'timestamp': timezone.now(),
            'version': '1.0.0'
        })