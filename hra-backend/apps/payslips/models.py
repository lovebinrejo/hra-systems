from django.db import models
from utils.mixins import TimestampMixin


class Payslip(TimestampMixin, models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('generated', 'Generated'),
        ('sent', 'Sent'),
    ]

    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='payslips')
    month = models.IntegerField()   # 1-12
    year = models.IntegerField()
    basic_salary = models.DecimalField(max_digits=10, decimal_places=2)
    hra = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    da = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    ta = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    other_allowances = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    pf_deduction = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax_deduction = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    other_deductions = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    loss_of_pay = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    gross_salary = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    net_salary = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    working_days = models.IntegerField(default=0)
    present_days = models.IntegerField(default=0)
    absent_days = models.IntegerField(default=0)
    leaves_taken = models.IntegerField(default=0)
    pdf_path = models.CharField(max_length=500, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    generated_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'payslips_payslip'
        unique_together = ['user', 'month', 'year']
        ordering = ['-year', '-month']

    def __str__(self):
        return f"Payslip - {self.user.full_name} ({self.month}/{self.year})"

    def compute_salary(self):
        """Auto-compute hra, da, pf, gross, net from basic_salary."""
        basic = float(self.basic_salary)
        self.hra = round(basic * 0.40, 2)
        self.da = round(basic * 0.20, 2)
        self.ta = round(basic * 0.05, 2)
        self.pf_deduction = round(basic * 0.12, 2)
        self.gross_salary = round(basic + float(self.hra) + float(self.da) + float(self.ta) + float(self.other_allowances), 2)
        self.net_salary = round(
            float(self.gross_salary)
            - float(self.pf_deduction)
            - float(self.tax_deduction)
            - float(self.other_deductions)
            - float(self.loss_of_pay),
            2,
        )
