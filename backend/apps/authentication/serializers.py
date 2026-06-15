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
        validators=[validate_password],  # enforces Django's password rules
    )

    class Meta:
        model = User
        fields = ("email", "password", "full_name")

    def create(self, validated_data):
        # Use our custom manager which hashes the password
        user = User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            full_name=validated_data["full_name"],
        )
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Used for GET /api/auth/me/ — returns user info.
    No password field here ever.
    """

    class Meta:
        model = User
        fields = ("id", "email", "full_name", "created_at")
        read_only_fields = ("id", "email", "created_at")


class PasswordChangeSerializer(serializers.Serializer):
    """
    Handles password change requests.
    Requires current password for verification before allowing change.
    """

    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(
        required=True, write_only=True, validators=[validate_password]
    )

    def validate_old_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect")
        return value

    def validate(self, data):
        if data["old_password"] == data["new_password"]:
            raise serializers.ValidationError(
                {"new_password": "New password must be different from old password"}
            )
        return data
