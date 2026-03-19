from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import User, PasswordResetToken, AdminPasswordResetRequest


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    is_admin_user = serializers.ReadOnlyField()
    profile_photo_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name', 'full_name',
            'role', 'profile_photo', 'profile_photo_url', 'department', 'designation',
            'employee_id', 'phone', 'date_of_birth', 'join_date', 'salary',
            'address', 'gender', 'marital_status', 'is_active', 'is_admin_user',
            'date_joined', 'created_at', 'must_change_password',
        ]
        read_only_fields = ['id', 'date_joined', 'created_at', 'is_admin_user', 'full_name']

    def get_profile_photo_url(self, obj):
        if obj.profile_photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_photo.url)
            return obj.profile_photo.url
        return None


class UserCreateSerializer(serializers.ModelSerializer):
    """Admin creates a new employee account."""
    password = serializers.CharField(write_only=True, required=False, default='HRA@2024!')

    class Meta:
        model = User
        fields = [
            'email', 'username', 'first_name', 'last_name', 'role',
            'department', 'designation', 'employee_id', 'phone',
            'join_date', 'salary', 'address', 'gender', 'marital_status', 'password',
        ]

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_employee_id(self, value):
        if value and User.objects.filter(employee_id=value).exists():
            raise serializers.ValidationError("Employee ID already in use.")
        return value

    def create(self, validated_data):
        password = validated_data.pop('password', 'User@1234')
        if not validated_data.get('username'):
            validated_data['username'] = validated_data['email'].split('@')[0]
        user = User(**validated_data)
        user.set_password(password)
        user.must_change_password = True
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        user = authenticate(request=self.context.get('request'), username=email, password=password)
        if not user:
            raise serializers.ValidationError("Invalid email or password.")
        if not user.is_active:
            raise serializers.ValidationError("Your account has been deactivated. Contact admin.")
        attrs['user'] = user
        return attrs


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if not User.objects.filter(email=value, is_active=True).exists():
            # Don't reveal whether email exists - silently succeed
            pass
        return value


class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        try:
            reset_token = PasswordResetToken.objects.select_related('user').get(token=attrs['token'])
        except PasswordResetToken.DoesNotExist:
            raise serializers.ValidationError({"token": "Invalid or expired reset token."})
        if not reset_token.is_valid:
            raise serializers.ValidationError({"token": "Reset token has expired or already been used."})
        try:
            validate_password(attrs['new_password'], reset_token.user)
        except Exception as e:
            raise serializers.ValidationError({"new_password": list(e.messages)})
        attrs['reset_token'] = reset_token
        return attrs


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return attrs

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value


class UserUpdateSerializer(serializers.ModelSerializer):
    """User can update their own limited profile fields."""
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'phone', 'address', 'date_of_birth', 'gender', 'marital_status']


class AdminUserUpdateSerializer(serializers.ModelSerializer):
    """Admin can update any user field."""
    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'email', 'role', 'department',
            'designation', 'employee_id', 'phone', 'date_of_birth',
            'join_date', 'salary', 'address', 'gender', 'marital_status', 'is_active',
        ]

    def validate_email(self, value):
        instance = self.instance
        if instance and User.objects.filter(email=value).exclude(pk=instance.pk).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_employee_id(self, value):
        instance = self.instance
        if value and User.objects.filter(employee_id=value).exclude(pk=instance.pk).exists():
            raise serializers.ValidationError("Employee ID already in use.")
        return value


class AdminPasswordResetRequestSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_department = serializers.CharField(source='user.department', read_only=True)

    class Meta:
        model = AdminPasswordResetRequest
        fields = ['id', 'user', 'user_name', 'user_email', 'user_department',
                  'reason', 'status', 'requested_at', 'resolved_at', 'new_password']
        read_only_fields = ['id', 'user', 'status', 'requested_at', 'resolved_at', 'new_password']
