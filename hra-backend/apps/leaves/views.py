from django.utils import timezone
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend

from .models import LeaveType, Holiday, LeaveRequest
from .serializers import (
    LeaveTypeSerializer, HolidaySerializer,
    LeaveRequestSerializer, LeaveRequestCreateSerializer, LeaveApprovalSerializer,
)
from .utils import deduct_leave_balance, restore_leave_balance
from utils.permissions import IsAdminUser, IsAdminOrReadOnly


class LeaveTypeViewSet(viewsets.ModelViewSet):
    queryset = LeaveType.objects.filter(is_active=True)
    serializer_class = LeaveTypeSerializer
    permission_classes = [IsAdminOrReadOnly]


class HolidayViewSet(viewsets.ModelViewSet):
    serializer_class = HolidaySerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['is_public', 'is_optional']
    ordering_fields = ['date']
    ordering = ['date']

    def get_queryset(self):
        qs = Holiday.objects.all()
        year = self.request.query_params.get('year')
        if year:
            qs = qs.filter(date__year=year)
        return qs

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        today = timezone.now().date()
        from datetime import timedelta
        upcoming = Holiday.objects.filter(date__gte=today, date__lte=today + timedelta(days=60)).order_by('date')
        return Response(HolidaySerializer(upcoming, many=True).data)


class LeaveRequestViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'leave_type']
    search_fields = ['user__first_name', 'user__last_name', 'user__email']
    ordering_fields = ['created_at', 'start_date']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        qs = LeaveRequest.objects.select_related('user', 'leave_type', 'reviewed_by')
        if not user.is_admin_user:
            qs = qs.filter(user=user)
        # Date range filters
        start = self.request.query_params.get('start_date')
        end = self.request.query_params.get('end_date')
        if start:
            qs = qs.filter(start_date__gte=start)
        if end:
            qs = qs.filter(end_date__lte=end)
        employee_id = self.request.query_params.get('employee')
        if employee_id and user.is_admin_user:
            qs = qs.filter(user_id=employee_id)
        return qs

    def get_serializer_class(self):
        if self.action == 'create':
            return LeaveRequestCreateSerializer
        return LeaveRequestSerializer

    def create(self, request, *args, **kwargs):
        serializer = LeaveRequestCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        leave_type = serializer.validated_data['leave_type']
        user = request.user
        gender = getattr(user, 'gender', '')

        if leave_type.name == 'maternity' and gender == 'male':
            return Response(
                {'error': True, 'message': 'Maternity leave is not applicable for male employees.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if leave_type.name == 'paternity' and gender == 'female':
            return Response(
                {'error': True, 'message': 'Paternity leave is not applicable for female employees.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def destroy(self, request, *args, **kwargs):
        leave = self.get_object()
        if leave.user != request.user and not request.user.is_admin_user:
            return Response({'error': True, 'message': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        if leave.status not in ['pending', 'approved']:
            return Response({'error': True, 'message': 'Only pending or approved leaves can be cancelled.'}, status=status.HTTP_400_BAD_REQUEST)
        # Restore balance if it was approved
        if leave.status == 'approved':
            restore_leave_balance(leave.user, leave.leave_type.name, leave.total_days)
        leave.status = 'cancelled'
        leave.save(update_fields=['status'])
        return Response({'message': 'Leave cancelled.'})

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def approve(self, request, pk=None):
        leave = self.get_object()
        if leave.status != 'pending':
            return Response({'error': True, 'message': 'Only pending leaves can be approved.'}, status=status.HTTP_400_BAD_REQUEST)
        deduct_leave_balance(leave.user, leave.leave_type.name, leave.total_days)
        leave.status = 'approved'
        leave.reviewed_by = request.user
        leave.reviewed_at = timezone.now()
        leave.save(update_fields=['status', 'reviewed_by', 'reviewed_at'])
        # Send notification
        try:
            from apps.notifications.utils import create_notification
            create_notification(
                recipient=leave.user,
                title='Leave Approved',
                message=f'Your {leave.leave_type.display_name} from {leave.start_date} to {leave.end_date} has been approved.',
                notification_type='leave_approved',
                action_url='/leaves',
            )
        except Exception:
            pass
        return Response(LeaveRequestSerializer(leave).data)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def reject(self, request, pk=None):
        leave = self.get_object()
        if leave.status != 'pending':
            return Response({'error': True, 'message': 'Only pending leaves can be rejected.'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = LeaveApprovalSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        leave.status = 'rejected'
        leave.reviewed_by = request.user
        leave.reviewed_at = timezone.now()
        leave.rejection_reason = serializer.validated_data.get('rejection_reason', '')
        leave.save(update_fields=['status', 'reviewed_by', 'reviewed_at', 'rejection_reason'])
        try:
            from apps.notifications.utils import create_notification
            create_notification(
                recipient=leave.user,
                title='Leave Rejected',
                message=f'Your {leave.leave_type.display_name} from {leave.start_date} to {leave.end_date} has been rejected. {leave.rejection_reason}',
                notification_type='leave_rejected',
                action_url='/leaves',
            )
        except Exception:
            pass
        return Response(LeaveRequestSerializer(leave).data)


class MyLeaveStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.employees.models import LeaveBalance
        year = timezone.now().year
        try:
            lb = LeaveBalance.objects.get(user=request.user, year=year)
            balance = {
                'paid': {'total': lb.paid_leaves_total, 'used': lb.paid_leaves_used, 'remaining': lb.paid_leaves_remaining},
                'unpaid': {'total': lb.unpaid_leaves_total, 'used': lb.unpaid_leaves_used, 'remaining': lb.unpaid_leaves_remaining},
                'sick': {'total': lb.sick_leaves_total, 'used': lb.sick_leaves_used, 'remaining': lb.sick_leaves_remaining},
                'casual': {'total': lb.casual_leaves_total, 'used': lb.casual_leaves_used, 'remaining': lb.casual_leaves_remaining},
            }
        except LeaveBalance.DoesNotExist:
            balance = {}

        pending_count = LeaveRequest.objects.filter(user=request.user, status='pending').count()
        approved_count = LeaveRequest.objects.filter(user=request.user, status='approved', start_date__year=year).count()

        return Response({
            'year': year,
            'balance': balance,
            'pending_requests': pending_count,
            'approved_this_year': approved_count,
        })
