from rest_framework import serializers
from .models import Category, Product, ProductImage, Review, Wishlist


class CategorySerializer(serializers.ModelSerializer):
    subcategories = serializers.SerializerMethodField()
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = (
            "id",
            "name",
            "slug",
            "description",
            "image",
            "parent",
            "subcategories",
            "product_count",
            "created_at",
        )

    def get_subcategories(self, obj):
        if obj.subcategories.exists():
            return CategorySerializer(obj.subcategories.all(), many=True).data
        return []

    def get_product_count(self, obj):
        return obj.products.filter(is_active=True).count()


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ("id", "image", "is_primary", "alt_text")


class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.username", read_only=True)
    user_email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = Review
        fields = (
            "id",
            "product",
            "user",
            "user_name",
            "user_email",
            "rating",
            "title",
            "comment",
            "is_verified",
            "helpful_count",
            "created_at",
        )
        read_only_fields = ("user", "is_verified", "helpful_count")


class ProductListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    discount_percentage = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = (
            "id",
            "name",
            "slug",
            "main_image",
            "price",
            "compare_price",
            "discount_percentage",
            "rating",
            "total_reviews",
            "is_in_stock",
            "brand",
            "condition",
            "category_name",
        )


class ProductDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    additional_images = ProductImageSerializer(many=True, read_only=True)
    reviews = ReviewSerializer(many=True, read_only=True)
    discount_percentage = serializers.ReadOnlyField()
    specifications = serializers.JSONField()

    class Meta:
        model = Product
        fields = (
            "id",
            "name",
            "slug",
            "category",
            "description",
            "short_description",
            "price",
            "compare_price",
            "discount_percentage",
            "stock_quantity",
            "sku",
            "brand",
            "condition",
            "warranty_months",
            "specifications",
            "main_image",
            "additional_images",
            "rating",
            "total_reviews",
            "is_in_stock",
            "is_active",
            "is_featured",
            "views_count",
            "created_at",
            "reviews",
        )


class WishlistSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)

    class Meta:
        model = Wishlist
        fields = ("id", "product", "added_at")
