from django.conf import settings
from django.core.mail import send_mail
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from django.utils import timezone
from .models import User, PasswordResetToken, AdminPasswordResetRequest
from .serializers import (
    UserSerializer, UserCreateSerializer, LoginSerializer,
    PasswordResetRequestSerializer, PasswordResetConfirmSerializer,
    ChangePasswordSerializer, UserUpdateSerializer, AdminUserUpdateSerializer,
    AdminPasswordResetRequestSerializer,
)
from utils.permissions import IsAdminUser


class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = 'auth'

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user, context={'request': request}).data,
        })


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({'message': 'Refresh token is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            return Response({'message': 'Invalid or already blacklisted token.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'message': 'Successfully logged out.'})


class RegisterAdminView(APIView):
    """Create the initial admin/superuser. Only works if no admin exists yet, or caller is already superuser."""
    permission_classes = [AllowAny]

    def post(self, request):
        # Allow if no superuser exists yet
        if User.objects.filter(is_superuser=True).exists():
            if not (request.user.is_authenticated and request.user.is_superuser):
                return Response(
                    {'error': True, 'message': 'Admin already exists. Only an existing superuser can create another admin.'},
                    status=status.HTTP_403_FORBIDDEN,
                )
        serializer = UserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save(role='admin', is_superuser=True, is_staff=True)
        refresh = RefreshToken.for_user(user)
        return Response({
            'message': 'Admin account created successfully.',
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user, context={'request': request}).data,
        }, status=status.HTTP_201_CREATED)


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = 'auth'

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        try:
            user = User.objects.get(email=email, is_active=True)
            reset_token = PasswordResetToken.create_for_user(user)
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
            reset_link = f"{frontend_url}/reset-password/{reset_token.token}"
            send_mail(
                subject='HRA System - Password Reset Request',
                message=f"Hi {user.first_name},\n\nClick the link below to reset your password:\n{reset_link}\n\nThis link expires in 1 hour.\n\nIf you did not request this, ignore this email.",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=True,
            )
        except User.DoesNotExist:
            pass  # Don't reveal whether email exists
        return Response({'message': 'If that email is registered, a reset link has been sent.'})


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reset_token = serializer.validated_data['reset_token']
        user = reset_token.user
        user.set_password(serializer.validated_data['new_password'])
        user.save(update_fields=['password'])
        reset_token.is_used = True
        reset_token.save(update_fields=['is_used'])
        return Response({'message': 'Password has been reset successfully.'})


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.must_change_password = False
        request.user.save(update_fields=['password', 'must_change_password'])
        return Response({'message': 'Password changed successfully.', 'must_change_password': False})


class UserMeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user, context={'request': request}).data)

    def put(self, request):
        serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user, context={'request': request}).data)

    def patch(self, request):
        return self.put(request)


class RequestAdminPasswordResetView(APIView):
    """Employee submits a password reset request to admin."""
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip()
        reason = request.data.get('reason', '').strip()
        try:
            user = User.objects.get(email=email, is_active=True, role='employee')
            # Avoid duplicate pending requests
            if not AdminPasswordResetRequest.objects.filter(user=user, status='pending').exists():
                AdminPasswordResetRequest.objects.create(user=user, reason=reason)
        except User.DoesNotExist:
            pass
        return Response({'message': 'Your request has been sent to the admin. They will reset your password shortly.'})


class AdminPasswordResetRequestsView(APIView):
    """Admin views and acts on password reset requests."""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        qs = AdminPasswordResetRequest.objects.select_related('user').filter(status='pending')
        serializer = AdminPasswordResetRequestSerializer(qs, many=True)
        return Response(serializer.data)


class AdminResolvePasswordResetView(APIView):
    """Admin resets password for a specific request."""
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, pk):
        try:
            reset_req = AdminPasswordResetRequest.objects.select_related('user').get(pk=pk, status='pending')
        except AdminPasswordResetRequest.DoesNotExist:
            return Response({'error': 'Request not found or already resolved.'}, status=status.HTTP_404_NOT_FOUND)

        import secrets, string
        alphabet = string.ascii_letters + string.digits
        new_password = 'Sta@' + ''.join(secrets.choice(alphabet) for _ in range(6))

        reset_req.user.set_password(new_password)
        reset_req.user.must_change_password = True
        reset_req.user.save(update_fields=['password', 'must_change_password'])

        reset_req.status = 'completed'
        reset_req.resolved_at = timezone.now()
        reset_req.resolved_by = request.user
        reset_req.new_password = new_password
        reset_req.save()

        return Response({
            'message': f"Password reset for {reset_req.user.full_name}.",
            'new_password': new_password,
            'user_email': reset_req.user.email,
        })


class ProfilePhotoUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    MAX_PHOTO_SIZE = 1 * 1024 * 1024  # 1 MB

    def post(self, request):
        photo = request.FILES.get('photo')
        if not photo:
            return Response({'error': True, 'message': 'No photo provided.'}, status=status.HTTP_400_BAD_REQUEST)
        if photo.size > self.MAX_PHOTO_SIZE:
            return Response({'error': True, 'message': 'Photo must be 1MB or less.'}, status=status.HTTP_400_BAD_REQUEST)
        content_type = photo.content_type or ''
        if not content_type.startswith('image/'):
            return Response({'error': True, 'message': 'File must be an image.'}, status=status.HTTP_400_BAD_REQUEST)
        # Delete old photo
        if request.user.profile_photo:
            request.user.profile_photo.delete(save=False)
        request.user.profile_photo = photo
        request.user.save(update_fields=['profile_photo'])
        return Response({
            'message': 'Profile photo updated.',
            'profile_photo_url': request.build_absolute_uri(request.user.profile_photo.url),
        })
