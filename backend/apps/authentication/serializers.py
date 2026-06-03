from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()  # This returns our CustomUser model


class RegisterSerializer(serializers.ModelSerializer):
    """
    Handles new user registration.
    password is write-only — it will never be returned in a response.
    """
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password]  # enforces Django's password rules
    )

    class Meta:
        model = User
        fields = ('email', 'password', 'full_name')

    def create(self, validated_data):
        # Use our custom manager which hashes the password
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            full_name=validated_data['full_name'],
        )
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Used for GET /api/auth/me/ — returns user info.
    No password field here ever.
    """
    class Meta:
        model = User
        fields = ('id', 'email', 'full_name', 'created_at')
        read_only_fields = ('id', 'email', 'created_at')