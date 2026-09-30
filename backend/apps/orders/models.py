from django.db import models

# Create your models here.
from django.db import models
from apps.accounts.models import User
from apps.products.models import Product


class Order(models.Model):
    STATUS_CHOICES = (
        ("pending", "Pending"),
        ("processing", "Processing"),
        ("paid", "Paid"),
        ("shipped", "Shipped"),
        ("delivered", "Delivered"),
        ("cancelled", "Cancelled"),
        ("refunded", "Refunded"),
    )

    DELIVERY_STATUS_CHOICES = (
        ("pending", "Pending"),
        ("assigned", "Assigned"),
        ("picked_up", "Picked Up"),
        ("in_transit", "In Transit"),
        ("delivered", "Delivered"),
        ("problematic", "Problematic"),
        ("failed", "Failed"),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="orders")
    order_number = models.CharField(max_length=50, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    assigned_delivery_person = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_orders",
    )
    delivery_status = models.CharField(
        max_length=20,
        choices=DELIVERY_STATUS_CHOICES,
        default="pending",
    )
    tracking_code = models.CharField(max_length=30, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    # Shipping information
    shipping_name = models.CharField(max_length=255)
    shipping_address = models.TextField()
    shipping_city = models.CharField(max_length=100)
    shipping_phone = models.CharField(max_length=20)

    # Payment information
    payment_method = models.CharField(max_length=50)
    payment_status = models.CharField(max_length=20, default="pending")
    transaction_id = models.CharField(max_length=100, blank=True)

    # Amounts
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    shipping_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)

    notes = models.TextField(blank=True)
    problem_reason = models.CharField(max_length=50, blank=True)
    problem_notes = models.TextField(blank=True)
    admin_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Order {self.order_number} - {self.user.email}"

    def save(self, *args, **kwargs):
        if not self.order_number:
            import uuid

            self.order_number = f"ORD-{uuid.uuid4().hex[:10].upper()}"
        if not self.tracking_code:
            import uuid

            self.tracking_code = f"DLV-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    class Meta:
        db_table = "orders"
        ordering = ["-created_at"]


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    product_name = models.CharField(max_length=255)
    product_price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField()
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.quantity} x {self.product_name}"

    class Meta:
        db_table = "order_items"


class TransactionLog(models.Model):
    """Immutable audit trail for orders, payments, and status changes."""

    class EventType(models.TextChoices):
        ORDER_CREATED = "order_created", "Order Created"
        PAYMENT_INITIATED = "payment_initiated", "Payment Initiated"
        PAYMENT_SUCCESS = "payment_success", "Payment Success"
        PAYMENT_FAILED = "payment_failed", "Payment Failed"
        ORDER_CANCELLED = "order_cancelled", "Order Cancelled"
        ORDER_STATUS_CHANGED = "order_status_changed", "Order Status Changed"
        DELIVERY_STATUS_CHANGED = "delivery_status_changed", "Delivery Status Changed"
        DELIVERY_CLAIMED = "delivery_claimed", "Delivery Claimed"

    class Outcome(models.TextChoices):
        SUCCESS = "success", "Success"
        FAILED = "failed", "Failed"
        PENDING = "pending", "Pending"

    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="transaction_logs",
        null=True,
        blank=True,
    )
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="transaction_logs",
    )
    event_type = models.CharField(max_length=40, choices=EventType.choices)
    outcome = models.CharField(
        max_length=20,
        choices=Outcome.choices,
        default=Outcome.PENDING,
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=3, default="ETB")
    reference = models.CharField(max_length=100, db_index=True)
    external_id = models.CharField(max_length=100, blank=True)
    payment_method = models.CharField(max_length=50, blank=True)
    message = models.CharField(max_length=255, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "transaction_logs"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["-created_at"]),
            models.Index(fields=["reference"]),
            models.Index(fields=["event_type"]),
        ]

    def __str__(self):
        return f"{self.event_type} | {self.reference} | {self.outcome}"
