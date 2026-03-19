from rest_framework import serializers
from .models import Payslip


class PayslipListSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = Payslip
        fields = ['id', 'user', 'user_name', 'month', 'year', 'net_salary', 'status', 'generated_at', 'pdf_path']

    def get_user_name(self, obj):
        return obj.user.full_name


class PayslipSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    user_email = serializers.SerializerMethodField()
    user_employee_id = serializers.SerializerMethodField()
    user_department = serializers.SerializerMethodField()

    class Meta:
        model = Payslip
        fields = [
            'id', 'user', 'user_name', 'user_email', 'user_employee_id', 'user_department',
            'month', 'year', 'basic_salary', 'hra', 'da', 'ta', 'other_allowances',
            'pf_deduction', 'tax_deduction', 'other_deductions', 'loss_of_pay',
            'gross_salary', 'net_salary', 'working_days', 'present_days',
            'absent_days', 'leaves_taken', 'pdf_path', 'status', 'generated_at',
        ]

    def get_user_name(self, obj): return obj.user.full_name
    def get_user_email(self, obj): return obj.user.email
    def get_user_employee_id(self, obj): return obj.user.employee_id
    def get_user_department(self, obj): return obj.user.department


class PayslipGenerateSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    month = serializers.IntegerField(min_value=1, max_value=12)
    year = serializers.IntegerField(min_value=2020, max_value=2100)
    other_allowances = serializers.DecimalField(max_digits=10, decimal_places=2, default=0, required=False)
    tax_deduction = serializers.DecimalField(max_digits=10, decimal_places=2, default=0, required=False)
    other_deductions = serializers.DecimalField(max_digits=10, decimal_places=2, default=0, required=False)
