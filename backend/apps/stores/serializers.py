from rest_framework import serializers
from .models import Store
from apps.products.models import Product


class StoreListSerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()
    owner_name = serializers.CharField(source="owner.username", read_only=True)

    class Meta:
        model = Store
        fields = (
            "id",
            "name",
            "slug",
            "description",
            "logo",
            "banner",
            "owner",
            "owner_name",
            "phone_number",
            "email",
            "address",
            "city",
            "latitude",
            "longitude",
            "rating",
            "total_reviews",
            "is_active",
            "is_verified",
            "product_count",
            "created_at",
        )

    def get_product_count(self, obj):
        return obj.products.filter(is_active=True).count()


class StoreDetailSerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()
    owner_name = serializers.CharField(source="owner.username", read_only=True)
    owner_email = serializers.CharField(source="owner.email", read_only=True)

    class Meta:
        model = Store
        fields = (
            "id",
            "name",
            "slug",
            "description",
            "logo",
            "banner",
            "owner",
            "owner_name",
            "owner_email",
            "phone_number",
            "email",
            "address",
            "city",
            "latitude",
            "longitude",
            "rating",
            "total_reviews",
            "is_active",
            "is_verified",
            "product_count",
            "created_at",
            "updated_at",
        )

    def get_product_count(self, obj):
        return obj.products.filter(is_active=True).count()


class StoreCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Store
        fields = (
            "id",
            "name",
            "description",
            "logo",
            "banner",
            "phone_number",
            "email",
            "address",
            "city",
            "latitude",
            "longitude",
            "is_active",
            "is_verified",
        )
        read_only_fields = ("is_verified",)


class AdminStoreSerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()
    owner_name = serializers.CharField(source="owner.username", read_only=True)

    class Meta:
        model = Store
        fields = (
            "id",
            "name",
            "slug",
            "description",
            "logo",
            "banner",
            "owner",
            "owner_name",
            "phone_number",
            "email",
            "address",
            "city",
            "latitude",
            "longitude",
            "rating",
            "total_reviews",
            "is_active",
            "is_verified",
            "product_count",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def get_product_count(self, obj):
        return obj.products.count()

