from decimal import Decimal

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.orders.models import Order, OrderItem
from apps.products.models import Category, Product
from apps.stores.models import Store


class StoreAnalyticsViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='seller',
            email='seller@example.com',
            password='StrongPass123',
            role='store_owner',
        )
        self.category = Category.objects.create(
            name='Laptops',
            slug='laptops',
            description='Portable computers',
        )
        self.store = Store.objects.create(
            name='Demo Store',
            slug='demo-store',
            owner=self.user,
            city='Addis Ababa',
            description='Test storefront',
        )
        self.product = Product.objects.create(
            name='Gaming Laptop',
            slug='gaming-laptop',
            category=self.category,
            store=self.store,
            description='Powerful laptop',
            price=Decimal('1200.00'),
            compare_price=Decimal('1400.00'),
            stock_quantity=5,
            sku='GL-001',
            brand='TechBrand',
            condition='new',
        )

    def test_vendor_analytics_returns_store_sales_summary(self):
        order = Order.objects.create(
            user=self.user,
            order_number='ORD-1001',
            status='paid',
            payment_status='paid',
            shipping_name='Seller Name',
            shipping_address='Bole Road',
            shipping_city='Addis Ababa',
            shipping_phone='+251912345678',
            payment_method='Cash',
            subtotal=Decimal('1200.00'),
            shipping_cost=Decimal('20.00'),
            tax=Decimal('0.00'),
            discount=Decimal('0.00'),
            total_amount=Decimal('1220.00'),
        )
        OrderItem.objects.create(
            order=order,
            product=self.product,
            product_name=self.product.name,
            product_price=self.product.price,
            quantity=2,
            subtotal=Decimal('2400.00'),
        )

        self.client.force_authenticate(self.user)
        response = self.client.get(reverse('vendor_analytics'))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['analytics']['total_products'], 1)
        self.assertEqual(response.data['analytics']['total_units_sold'], 2)
        self.assertEqual(float(response.data['analytics']['total_revenue']), 2400.0)
