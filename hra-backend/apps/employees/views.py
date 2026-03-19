from django.utils import timezone
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend

from apps.accounts.models import User
from apps.accounts.serializers import UserCreateSerializer, AdminUserUpdateSerializer, UserSerializer
from .models import LeaveBalance
from .serializers import (
    EmployeeListSerializer, EmployeeDetailSerializer,
    LeaveBalanceSerializer, LeaveBalanceUpdateSerializer,
)
from utils.permissions import IsAdminUser


class EmployeeViewSet(viewsets.ModelViewSet):
    """Admin-only CRUD for employees."""
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['department', 'role', 'is_active']
    search_fields = ['email', 'first_name', 'last_name', 'employee_id', 'designation']
    ordering_fields = ['date_joined', 'first_name', 'last_name', 'salary']
    ordering = ['-date_joined']

    def get_queryset(self):
        return User.objects.all().order_by('-date_joined')

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        if self.action in ['update', 'partial_update']:
            return AdminUserUpdateSerializer
        if self.action in ['retrieve', 'leave_balance', 'update_leave_balance']:
            return EmployeeDetailSerializer
        return EmployeeListSerializer

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    def create(self, request, *args, **kwargs):
        serializer = UserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            EmployeeDetailSerializer(user, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        user = self.get_object()
        user.is_active = True
        user.save(update_fields=['is_active'])
        return Response({'message': f'{user.full_name} has been activated.'})

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        user = self.get_object()
        if user.is_superuser:
            return Response({'error': True, 'message': 'Cannot deactivate a superuser.'}, status=status.HTTP_400_BAD_REQUEST)
        user.is_active = False
        user.save(update_fields=['is_active'])
        return Response({'message': f'{user.full_name} has been deactivated.'})

    @action(detail=True, methods=['get'])
    def leave_balance(self, request, pk=None):
        user = self.get_object()
        year = request.query_params.get('year', timezone.now().year)
        try:
            lb = LeaveBalance.objects.get(user=user, year=year)
        except LeaveBalance.DoesNotExist:
            lb = LeaveBalance.objects.create(user=user, year=year)
        return Response(LeaveBalanceSerializer(lb).data)

    @action(detail=True, methods=['put', 'patch'], url_path='leave-balance/update')
    def update_leave_balance(self, request, pk=None):
        user = self.get_object()
        year = request.data.get('year', timezone.now().year)
        lb, _ = LeaveBalance.objects.get_or_create(user=user, year=year)
        serializer = LeaveBalanceUpdateSerializer(lb, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(LeaveBalanceSerializer(lb).data)


class CurrentUserLeaveBalanceView(APIView):
    """Logged-in employee's current year leave balance."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        year = int(request.query_params.get('year', timezone.now().year))
        lb, _ = LeaveBalance.objects.get_or_create(
            user=request.user,
            year=year,
            defaults={'paid_leaves_total': 20, 'unpaid_leaves_total': 10, 'sick_leaves_total': 10, 'casual_leaves_total': 8},
        )
        return Response(LeaveBalanceSerializer(lb).data)
