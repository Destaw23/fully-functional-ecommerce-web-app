from django.db import models

from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator
# Create your models here.


class User(AbstractUser):
    ROLE_CHOICES = (
        ("customer", "Customer"),
        ("admin", "Administrator"),
        ("delivery", "Delivery Personnel"),
    )

    phone_regex = RegexValidator(
        regex=r"^\+?251?[0-9]{9,12}$",
        message="Phone number must be Ethiopian format (+2519XXXXXXXX or 09XXXXXXXX)",
    )
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)
    phone_number = models.CharField(
        validators=[phone_regex], max_length=13, unique=True, blank=True, null=True
    )
    role = models.CharField(max_length=15, choices=ROLE_CHOICES, default="customer")
    address = models.TextField(blank=True)
    profile_picture = models.ImageField(upload_to="profiles/", null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def __str__(self):
        return self.email

    @property
    def is_admin(self):
        return self.role == "admin" or self.is_superuser

    @property
    def is_delivery(self):
        return self.role == "delivery"

    class Meta:
        db_table = "users"
        ordering = ["-date_joined"]


class PasswordResetCode(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="password_reset_codes")
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    class Meta:
        db_table = "password_reset_codes"
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["code", "user"])]

    def __str__(self):
        return f"{self.user.email} - {self.code}"
#destaw    destawebabu77@gmail.com    Uog@29-21