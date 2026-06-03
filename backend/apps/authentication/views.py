from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model

from .serializers import RegisterSerializer, UserProfileSerializer

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