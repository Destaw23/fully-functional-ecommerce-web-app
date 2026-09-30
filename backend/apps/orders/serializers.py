from rest_framework import serializers
from .models import Order, OrderItem
from apps.products.serializers import ProductListSerializer
from apps.accounts.serializers import UserSerializer


class OrderItemSerializer(serializers.ModelSerializer):
    product_detail = ProductListSerializer(source="product", read_only=True)

    class Meta:
        model = OrderItem
        fields = (
            "id",
            "product",
            "product_detail",
            "product_name",
            "product_price",
            "quantity",
            "subtotal",
        )


from django.db.models import Sum

class OrderListSerializer(serializers.ModelSerializer):
    total_items = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = (
            "id",
            "order_number",
            "status",
            "payment_status",
            "total_amount",
            "total_items",
            "created_at",
        )

    def get_total_items(self, obj):
        return obj.items.aggregate(total=Sum("quantity"))["total"] or 0


class OrderDetailSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    assigned_delivery_person_detail = UserSerializer(source="assigned_delivery_person", read_only=True)
    assigned_delivery_person_name = serializers.SerializerMethodField()
    user_email = serializers.EmailField(source="user.email", read_only=True)
    user_name = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = Order
        fields = (
            "id",
            "order_number",
            "status",
            "delivery_status",
            "tracking_code",
            "assigned_delivery_person",
            "assigned_delivery_person_detail",
            "assigned_delivery_person_name",
            "user_email",
            "user_name",
            "shipping_name",
            "shipping_address",
            "shipping_city",
            "shipping_phone",
            "payment_method",
            "payment_status",
            "transaction_id",
            "subtotal",
            "shipping_cost",
            "tax",
            "discount",
            "total_amount",
            "notes",
            "problem_reason",
            "problem_notes",
            "admin_notes",
            "created_at",
            "updated_at",
            "delivered_at",
            "items",
        )

    def get_assigned_delivery_person_name(self, obj):
        if obj.assigned_delivery_person:
            u = obj.assigned_delivery_person
            return u.get_full_name() or u.username or u.email
        return None



class OrderCreateSerializer(serializers.Serializer):
    shipping_name = serializers.CharField(max_length=255)
    shipping_address = serializers.CharField()
    shipping_city = serializers.CharField(max_length=100)
    shipping_phone = serializers.CharField(max_length=20)
    payment_method = serializers.CharField(max_length=50)
    notes = serializers.CharField(required=False, allow_blank=True)
