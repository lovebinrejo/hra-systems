from django.utils import timezone
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend

from .models import Attendance
from .serializers import (
    AttendanceSerializer, AttendanceListSerializer,
    CheckInSerializer, CheckOutSerializer,
)
from .utils import calculate_work_hours, is_late_arrival
from utils.exceptions import OutsideOfficeRadiusError
from utils.geo import is_within_office_radius, validate_coordinates
from utils.permissions import IsAdminUser


class CheckInView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_scope = 'attendance'

    def post(self, request):
        serializer = CheckInSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        lat = serializer.validated_data['lat']
        lng = serializer.validated_data['lng']
        notes = serializer.validated_data.get('notes', '')

        if not validate_coordinates(lat, lng):
            return Response({'error': True, 'message': 'Invalid coordinates.'}, status=status.HTTP_400_BAD_REQUEST)

        within_radius, distance_km = is_within_office_radius(lat, lng)
        if not within_radius:
            raise OutsideOfficeRadiusError(distance_km)

        today = timezone.localdate()
        now_time = timezone.localtime().time()

        attendance, created = Attendance.objects.get_or_create(
            user=request.user,
            date=today,
            defaults={'status': 'present', 'sessions': []}
        )

        sessions = attendance.sessions or []

        # Block if there's an open session (checked in but not out)
        if sessions and sessions[-1].get('check_out_time') is None:
            return Response(
                {'error': True, 'message': 'Already checked in. Please check out first.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        new_session = {
            'check_in_time': now_time.strftime('%H:%M:%S'),
            'check_out_time': None,
            'check_in_location': {'lat': lat, 'lng': lng},
            'check_out_location': None,
            'distance_km': distance_km,
            'hours': None,
        }
        sessions.append(new_session)
        attendance.sessions = sessions
        attendance.status = 'present'

        # Keep legacy fields in sync for first session
        if len(sessions) == 1:
            attendance.check_in_time = now_time
            attendance.check_in_location = {'lat': lat, 'lng': lng}
            attendance.check_in_distance_km = distance_km
            attendance.is_late = is_late_arrival(now_time)
        if notes:
            attendance.notes = notes

        attendance.save()
        return Response(AttendanceSerializer(attendance).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class CheckOutView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_scope = 'attendance'

    def post(self, request):
        serializer = CheckOutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        lat = serializer.validated_data.get('lat')
        lng = serializer.validated_data.get('lng')
        notes = serializer.validated_data.get('notes', '')

        today = timezone.localdate()
        try:
            attendance = Attendance.objects.get(user=request.user, date=today)
        except Attendance.DoesNotExist:
            return Response({'error': True, 'message': 'No check-in record found for today.'}, status=status.HTTP_400_BAD_REQUEST)

        sessions = attendance.sessions or []
        if not sessions or sessions[-1].get('check_out_time') is not None:
            return Response({'error': True, 'message': 'Not currently checked in.'}, status=status.HTTP_400_BAD_REQUEST)

        checkout_time = timezone.localtime().time()

        # Close the open session
        last = sessions[-1]
        last['check_out_time'] = checkout_time.strftime('%H:%M:%S')
        if lat and lng:
            last['check_out_location'] = {'lat': lat, 'lng': lng}

        # Calculate this session's hours
        from datetime import datetime as dt
        ci = dt.strptime(last['check_in_time'], '%H:%M:%S').time()
        session_hours = calculate_work_hours(ci, checkout_time)
        last['hours'] = session_hours
        sessions[-1] = last

        # Total = sum of all completed sessions
        total_hours = round(sum(s.get('hours') or 0 for s in sessions), 2)

        attendance.sessions = sessions
        attendance.work_hours = total_hours
        attendance.check_out_time = checkout_time
        if lat and lng:
            attendance.check_out_location = {'lat': lat, 'lng': lng}
        if total_hours < 4:
            attendance.status = 'half_day'
        if notes:
            attendance.notes = (attendance.notes + ' | ' + notes).strip(' | ')
        attendance.save()

        return Response(AttendanceSerializer(attendance).data)


class TodayAttendanceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.localdate()
        try:
            attendance = Attendance.objects.get(user=request.user, date=today)
            return Response(AttendanceSerializer(attendance).data)
        except Attendance.DoesNotExist:
            return Response({'checked_in': False, 'date': str(today)})


class AttendanceViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'is_late', 'date']
    search_fields = ['user__first_name', 'user__last_name', 'user__email']
    ordering_fields = ['date', 'check_in_time', 'work_hours']
    ordering = ['-date']

    def get_queryset(self):
        user = self.request.user
        qs = Attendance.objects.select_related('user')
        if not user.is_admin_user:
            qs = qs.filter(user=user)
        # Date range
        start = self.request.query_params.get('start_date')
        end = self.request.query_params.get('end_date')
        if start:
            qs = qs.filter(date__gte=start)
        if end:
            qs = qs.filter(date__lte=end)
        employee_id = self.request.query_params.get('employee')
        if employee_id and user.is_admin_user:
            qs = qs.filter(user_id=employee_id)
        return qs

    def get_serializer_class(self):
        if self.action == 'list':
            return AttendanceListSerializer
        return AttendanceSerializer

    @action(detail=False, methods=['get'])
    def monthly_summary(self, request):
        month = int(request.query_params.get('month', timezone.localdate().month))
        year = int(request.query_params.get('year', timezone.localdate().year))
        user_id = request.query_params.get('employee')

        if user_id and request.user.is_admin_user:
            records = Attendance.objects.filter(user_id=user_id, date__month=month, date__year=year)
        else:
            records = Attendance.objects.filter(user=request.user, date__month=month, date__year=year)

        summary = {
            'month': month,
            'year': year,
            'present': records.filter(status='present').count(),
            'absent': records.filter(status='absent').count(),
            'half_day': records.filter(status='half_day').count(),
            'on_leave': records.filter(status='on_leave').count(),
            'late_arrivals': records.filter(is_late=True).count(),
            'total_work_hours': sum(r.work_hours or 0 for r in records),
            'records': AttendanceListSerializer(records.order_by('date'), many=True).data,
        }
        return Response(summary)

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def mark_absent(self, request, pk=None):
        attendance = self.get_object()
        attendance.status = 'absent'
        attendance.save(update_fields=['status'])
        return Response({'message': 'Marked as absent.'})
