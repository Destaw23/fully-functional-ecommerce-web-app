from django.contrib import admin
from .models import Store


@admin.register(Store)
class StoreAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "city",
        "owner",
        "rating",
        "total_reviews",
        "is_verified",
        "is_active",
        "created_at",
    )
    list_filter = ("is_verified", "is_active", "city")
    search_fields = ("name", "description", "city", "address", "phone_number")
    prepopulated_fields = {"slug": ("name",)}
