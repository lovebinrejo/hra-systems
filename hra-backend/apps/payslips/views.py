import os
from django.conf import settings
from django.http import FileResponse
from django.utils import timezone
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from apps.accounts.models import User
from .models import Payslip
from .serializers import PayslipSerializer, PayslipListSerializer, PayslipGenerateSerializer
from .utils import generate_payslip_pdf
from utils.permissions import IsAdminUser


def _build_payslip_for_user(user, month, year, extra=None):
    """Build or update a Payslip for a given user/month/year."""
    from apps.attendance.models import Attendance
    import calendar

    extra = extra or {}
    basic = float(user.salary)
    hra = round(basic * 0.40, 2)
    da = round(basic * 0.20, 2)
    ta = round(basic * 0.05, 2)
    pf = round(basic * 0.12, 2)
    other_allowances = float(extra.get('other_allowances', 0))
    tax_deduction = float(extra.get('tax_deduction', 0))
    other_deductions = float(extra.get('other_deductions', 0))
    gross = basic + hra + da + ta + other_allowances

    # Attendance data
    records = Attendance.objects.filter(user=user, date__month=month, date__year=year)
    present_days = records.filter(status__in=['present', 'half_day']).count()
    absent_days = records.filter(status='absent').count()
    on_leave_days = records.filter(status='on_leave').count()
    _, working_days_in_month = calendar.monthrange(year, month)
    # Deduct weekends
    import datetime
    weekdays = sum(
        1 for d in range(1, working_days_in_month + 1)
        if datetime.date(year, month, d).weekday() < 5
    )
    lop = round((absent_days / max(weekdays, 1)) * basic, 2)
    net = round(gross - pf - tax_deduction - other_deductions - lop, 2)

    payslip, _ = Payslip.objects.update_or_create(
        user=user, month=month, year=year,
        defaults={
            'basic_salary': basic,
            'hra': hra, 'da': da, 'ta': ta,
            'other_allowances': other_allowances,
            'pf_deduction': pf,
            'tax_deduction': tax_deduction,
            'other_deductions': other_deductions,
            'loss_of_pay': lop,
            'gross_salary': gross,
            'net_salary': max(0, net),
            'working_days': weekdays,
            'present_days': present_days,
            'absent_days': absent_days,
            'leaves_taken': on_leave_days,
            'status': 'generated',
            'generated_at': timezone.now(),
        }
    )
    # Generate PDF
    pdf_path = generate_payslip_pdf(payslip)
    payslip.pdf_path = pdf_path
    payslip.save(update_fields=['pdf_path'])
    return payslip


class PayslipViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['month', 'year', 'status']
    ordering = ['-year', '-month']

    def get_queryset(self):
        user = self.request.user
        qs = Payslip.objects.select_related('user')
        if not user.is_admin_user:
            qs = qs.filter(user=user)
        emp_id = self.request.query_params.get('employee')
        if emp_id and user.is_admin_user:
            qs = qs.filter(user_id=emp_id)
        return qs

    def get_serializer_class(self):
        if self.action == 'list':
            return PayslipListSerializer
        return PayslipSerializer

    @action(detail=False, methods=['post'], permission_classes=[IsAdminUser])
    def generate(self, request):
        serializer = PayslipGenerateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data
        try:
            user = User.objects.get(id=d['user_id'], is_active=True)
        except User.DoesNotExist:
            return Response({'error': True, 'message': 'Employee not found.'}, status=status.HTTP_404_NOT_FOUND)
        payslip = _build_payslip_for_user(user, d['month'], d['year'], extra=d)
        return Response(PayslipSerializer(payslip).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], permission_classes=[IsAdminUser], url_path='generate-bulk')
    def generate_bulk(self, request):
        month = int(request.data.get('month', timezone.localdate().month))
        year = int(request.data.get('year', timezone.localdate().year))
        employees = User.objects.filter(is_active=True, role='employee')
        generated = []
        errors = []
        for emp in employees:
            if emp.salary <= 0:
                errors.append({'employee': emp.email, 'error': 'No salary configured.'})
                continue
            try:
                ps = _build_payslip_for_user(emp, month, year)
                generated.append(emp.email)
            except Exception as e:
                errors.append({'employee': emp.email, 'error': str(e)})
        return Response({'generated': generated, 'errors': errors, 'total': len(generated)})

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        payslip = self.get_object()
        if not payslip.pdf_path:
            return Response({'error': True, 'message': 'PDF not yet generated.'}, status=status.HTTP_404_NOT_FOUND)
        abs_path = os.path.join(settings.MEDIA_ROOT, payslip.pdf_path)
        if not os.path.exists(abs_path):
            # Regenerate
            try:
                pdf_path = generate_payslip_pdf(payslip)
                payslip.pdf_path = pdf_path
                payslip.save(update_fields=['pdf_path'])
                abs_path = os.path.join(settings.MEDIA_ROOT, pdf_path)
            except Exception as e:
                return Response({'error': True, 'message': f'PDF generation failed: {e}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        response = FileResponse(open(abs_path, 'rb'), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="payslip_{payslip.month:02d}_{payslip.year}.pdf"'
        return response
