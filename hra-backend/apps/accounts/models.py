import secrets
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from utils.mixins import TimestampMixin


class User(AbstractUser, TimestampMixin):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('employee', 'Employee'),
    ]
    DEPARTMENT_CHOICES = [
        ('engineering', 'Engineering'),
        ('hr', 'HR'),
        ('finance', 'Finance'),
        ('marketing', 'Marketing'),
        ('operations', 'Operations'),
        ('sales', 'Sales'),
        ('other', 'Other'),
    ]
    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
    ]
    MARITAL_STATUS_CHOICES = [
        ('single', 'Single'),
        ('married', 'Married'),
        ('divorced', 'Divorced'),
        ('widowed', 'Widowed'),
    ]

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='employee')
    profile_photo = models.ImageField(upload_to='profiles/', null=True, blank=True)
    department = models.CharField(max_length=100, choices=DEPARTMENT_CHOICES, blank=True)
    designation = models.CharField(max_length=100, blank=True)
    employee_id = models.CharField(max_length=20, unique=True, null=True, blank=True)
    phone = models.CharField(max_length=15, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    join_date = models.DateField(null=True, blank=True)
    salary = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    address = models.TextField(blank=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True)
    marital_status = models.CharField(max_length=10, choices=MARITAL_STATUS_CHOICES, blank=True)
    must_change_password = models.BooleanField(default=False)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    class Meta:
        db_table = 'accounts_user'
        ordering = ['-date_joined']

    @property
    def is_admin_user(self):
        return self.role == 'admin' or self.is_superuser

    @property
    def full_name(self):
        name = f"{self.first_name} {self.last_name}".strip()
        return name if name else self.username

    def __str__(self):
        return f"{self.full_name} <{self.email}>"


class PasswordResetToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_reset_tokens')
    token = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    class Meta:
        db_table = 'accounts_password_reset_token'

    @classmethod
    def create_for_user(cls, user):
        # Invalidate old tokens
        cls.objects.filter(user=user, is_used=False).update(is_used=True)
        token = secrets.token_urlsafe(32)
        expires_at = timezone.now() + timezone.timedelta(hours=1)
        return cls.objects.create(user=user, token=token, expires_at=expires_at)

    @property
    def is_valid(self):
        return not self.is_used and timezone.now() < self.expires_at

    def __str__(self):
        return f"PasswordResetToken for {self.user.email}"


class AdminPasswordResetRequest(models.Model):
    STATUS_CHOICES = [('pending', 'Pending'), ('completed', 'Completed'), ('rejected', 'Rejected')]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='admin_reset_requests')
    reason = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    requested_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='resolved_reset_requests')
    new_password = models.CharField(max_length=128, blank=True)  # temp, shown once

    class Meta:
        db_table = 'accounts_admin_password_reset_request'
        ordering = ['-requested_at']

    def __str__(self):
        return f"ResetRequest({self.user.email}, {self.status})"
