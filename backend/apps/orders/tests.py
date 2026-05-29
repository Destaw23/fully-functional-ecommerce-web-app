import threading
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TransactionTestCase
from rest_framework.test import APIClient

from apps.cart.models import Cart, CartItem
from apps.orders.models import Order
from apps.products.models import Category, Product


class CreateOrderRaceConditionTest(TransactionTestCase):
    def test_only_one_concurrent_order_can_use_last_unit_of_stock(self):
        user = get_user_model().objects.create_user(
            username="buyer",
            email="buyer@example.com",
            password="StrongPass123!",
        )
        category = Category.objects.create(name="Phones", slug="phones", description="")
        product = Product.objects.create(
            name="Test Product",
            slug="test-product",
            category=category,
            description="A test product",
            short_description="Test product",
            price=Decimal("49.99"),
            compare_price=None,
            stock_quantity=1,
            sku="SKU-RACE-1",
            brand="Brand",
            condition="new",
            warranty_months=0,
            is_active=True,
        )
        cart = Cart.objects.create(user=user)
        CartItem.objects.create(cart=cart, product=product, quantity=1)

        payload = {
            "shipping_name": "Buyer Name",
            "shipping_address": "Addis Ababa",
            "shipping_city": "Addis Ababa",
            "shipping_phone": "0912345678",
            "payment_method": "cash_on_delivery",
            "notes": "",
        }

        results = []
        barrier = threading.Barrier(2)

        def place_order():
            client = APIClient()
            client.force_authenticate(user)
            barrier.wait()
            response = client.post("/api/orders/create/", payload, format="json")
            results.append(response.status_code)

        first = threading.Thread(target=place_order)
        second = threading.Thread(target=place_order)

        first.start()
        second.start()
        first.join()
        second.join()

        self.assertEqual(results.count(201), 1)
        self.assertEqual(results.count(400), 1)
        self.assertEqual(Order.objects.count(), 1)

        product.refresh_from_db()
        self.assertEqual(product.stock_quantity, 0)
