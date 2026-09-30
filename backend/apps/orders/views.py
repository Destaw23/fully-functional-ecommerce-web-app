from django.shortcuts import render

# Create your views here.
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.db import transaction, models
from django.utils import timezone
from decimal import Decimal
from .models import Order, OrderItem
from .serializers import (
    OrderListSerializer,
    OrderDetailSerializer,
    OrderCreateSerializer,
)
from apps.cart.models import Cart, CartItem
from apps.products.models import Product
from apps.recommendations.models import Interaction
from .transaction_log import record_transaction_log
from .models import TransactionLog


class OrderListView(generics.ListAPIView):
    serializer_class = OrderListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)


class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderDetailSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)


class CreateOrderView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        serializer = OrderCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        cart = Cart.objects.filter(user=request.user).first()
        if not cart or not cart.items.exists():
            order_items = request.data.get('orderItems') or []
            if order_items:
                cart, _ = Cart.objects.get_or_create(user=request.user)
                cart.items.all().delete()
                for item in order_items:
                    product_id = item.get('product_id') or item.get('_id') or item.get('id')
                    quantity = item.get('quantity', 1)
                    product = Product.objects.filter(id=product_id, is_active=True).first()
                    if product and quantity > 0:
                        CartItem.objects.create(cart=cart, product=product, quantity=quantity)
            if not cart or not cart.items.exists():
                return Response(
                    {"error": "Cart is empty"}, status=status.HTTP_400_BAD_REQUEST
                )

        # Reserve stock atomically so only one checkout can consume the last unit.
        for item in cart.items.select_related("product").all():
            updated = Product.objects.filter(
                id=item.product_id,
                stock_quantity__gte=item.quantity,
            ).update(stock_quantity=models.F("stock_quantity") - item.quantity)
            if updated != 1:
                return Response(
                    {"error": f"Insufficient stock for {item.product.name}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Calculate amounts
        subtotal = cart.subtotal
        shipping_cost = Decimal('0.00')  # Free shipping for demo
        tax = subtotal * Decimal('0.15')  # 15% VAT for Ethiopia
        total = subtotal + shipping_cost + tax

        # Create order
        order = Order.objects.create(
            user=request.user,
            status="pending",
            shipping_name=serializer.validated_data["shipping_name"],
            shipping_address=serializer.validated_data["shipping_address"],
            shipping_city=serializer.validated_data["shipping_city"],
            shipping_phone=serializer.validated_data["shipping_phone"],
            payment_method=serializer.validated_data["payment_method"],
            notes=serializer.validated_data.get("notes", ""),
            subtotal=subtotal,
            shipping_cost=shipping_cost,
            tax=tax,
            total_amount=total,
        )

        # Create order items and update stock
        for cart_item in cart.items.all():
            OrderItem.objects.create(
                order=order,
                product=cart_item.product,
                product_name=cart_item.product.name,
                product_price=cart_item.product.price,
                quantity=cart_item.quantity,
                subtotal=cart_item.subtotal,
            )
            session_id = (
                getattr(request.session, "session_key", "") or ""
                if hasattr(request, "session") and request.session
                else ""
            )
            Interaction.objects.create(
                user=request.user,
                product=cart_item.product,
                action="purchase",
                session_id=session_id,
            )

        # Clear cart
        cart.items.all().delete()

        record_transaction_log(
            request=request,
            order=order,
            user=request.user,
            event_type=TransactionLog.EventType.ORDER_CREATED,
            outcome=TransactionLog.Outcome.SUCCESS,
            amount=order.total_amount,
            reference=order.order_number,
            payment_method=order.payment_method,
            message="Order placed from checkout",
            metadata={"item_count": order.items.count()},
        )

        return Response(
            {
                "order": OrderDetailSerializer(order).data,
                "payment_url": f"/api/payments/initiate/{order.order_number}/",
            },
            status=status.HTTP_201_CREATED,
        )


class DeliveryOrdersView(generics.ListAPIView):
    serializer_class = OrderDetailSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, "role", "") != "delivery" and not getattr(user, "is_admin", False):
            return Order.objects.none()
        
        qs = Order.objects.filter(assigned_delivery_person=user)
        status_filter = self.request.query_params.get("status")
        if status_filter == "completed":
            qs = qs.filter(delivery_status="delivered")
        elif status_filter == "problematic":
            qs = qs.filter(delivery_status__in=["problematic", "failed"])
        elif status_filter == "active":
            qs = qs.filter(delivery_status__in=["assigned", "picked_up", "in_transit"])
        return qs.order_by("-updated_at")


class AvailableDeliveryOrdersView(generics.ListAPIView):
    serializer_class = OrderDetailSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, "role", "") != "delivery" and not getattr(user, "is_admin", False):
            return Order.objects.none()
        return (
            Order.objects
            .filter(assigned_delivery_person__isnull=True)
            .exclude(status__in=["cancelled", "delivered"])
            .order_by("-created_at")
        )


class ClaimDeliveryOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, order_id):
        if getattr(request.user, "role", "") != "delivery" and not getattr(request.user, "is_admin", False):
            return Response({"error": "Only delivery personnel or admins can claim orders."}, status=status.HTTP_403_FORBIDDEN)

        order = Order.objects.filter(id=order_id).first()
        if not order:
            return Response({"error": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

        order.assigned_delivery_person = request.user
        order.delivery_status = "assigned"
        if order.status == "pending":
            order.status = "processing"
        order.save()
        record_transaction_log(
            request=request,
            order=order,
            event_type=TransactionLog.EventType.DELIVERY_CLAIMED,
            outcome=TransactionLog.Outcome.SUCCESS,
            amount=order.total_amount,
            reference=order.order_number,
            message=f"Claimed by {request.user.username}",
        )
        return Response(OrderDetailSerializer(order).data, status=status.HTTP_200_OK)


class UpdateDeliveryStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, order_id):
        user = request.user
        is_delivery = getattr(user, "role", "") == "delivery"
        is_admin = getattr(user, "is_admin", False)

        if not is_delivery and not is_admin:
            return Response({"error": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        order = Order.objects.filter(id=order_id).first()
        if not order:
            return Response({"error": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

        delivery_status = request.data.get("delivery_status")
        problem_reason = request.data.get("problem_reason", "")
        problem_notes = request.data.get("problem_notes", "")
        admin_notes = request.data.get("admin_notes", "")
        previous_delivery_status = order.delivery_status
        previous_order_status = order.status

        if delivery_status:
            if delivery_status not in [choice[0] for choice in Order.DELIVERY_STATUS_CHOICES]:
                return Response({"error": "Invalid delivery status."}, status=status.HTTP_400_BAD_REQUEST)
            order.delivery_status = delivery_status
            if delivery_status == "delivered":
                order.status = "delivered"
                order.delivered_at = timezone.now()
            elif delivery_status in ["picked_up", "in_transit", "assigned"]:
                if order.status != "delivered":
                    order.status = "shipped"

        if problem_reason:
            order.problem_reason = problem_reason
        if problem_notes:
            order.problem_notes = problem_notes
        if admin_notes:
            order.admin_notes = admin_notes

        order.save()
        if delivery_status and delivery_status != previous_delivery_status:
            record_transaction_log(
                request=request,
                order=order,
                event_type=TransactionLog.EventType.DELIVERY_STATUS_CHANGED,
                outcome=TransactionLog.Outcome.SUCCESS,
                amount=order.total_amount,
                reference=order.order_number,
                message=f"Delivery {previous_delivery_status} → {order.delivery_status}",
                metadata={
                    "from": previous_delivery_status,
                    "to": order.delivery_status,
                    "order_status_from": previous_order_status,
                    "order_status_to": order.status,
                    "problem_reason": problem_reason or None,
                },
            )
        return Response(OrderDetailSerializer(order).data, status=status.HTTP_200_OK)


class CancelOrderView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, order_id):
        order = Order.objects.get(id=order_id, user=request.user)

        if order.status not in ["pending", "processing"]:
            return Response(
                {"error": "Order cannot be cancelled"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Restore stock
        for item in order.items.all():
            if item.product:
                item.product.stock_quantity += item.quantity
                item.product.save()

        order.status = "cancelled"
        order.save()

        record_transaction_log(
            request=request,
            order=order,
            user=request.user,
            event_type=TransactionLog.EventType.ORDER_CANCELLED,
            outcome=TransactionLog.Outcome.SUCCESS,
            amount=order.total_amount,
            reference=order.order_number,
            payment_method=order.payment_method,
            message="Order cancelled by customer",
        )

        return Response({"message": "Order cancelled successfully"})
