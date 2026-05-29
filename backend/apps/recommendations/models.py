from django.db import models

# Create your models here.

from apps.accounts.models import User
from apps.products.models import Product


class Interaction(models.Model):
    ACTION_CHOICES = (
        ("view", "View"),
        ("search", "Search"),
        ("add_to_cart", "Add to Cart"),
        ("purchase", "Purchase"),
        ("wishlist", "Wishlist"),
    )

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="interactions"
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="interactions",
    )
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    session_id = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} - {self.action} - {self.product.name}"

    class Meta:
        db_table = "interactions"
        indexes = [
            models.Index(fields=["user", "action"]),
            models.Index(fields=["product", "action"]),
        ]
