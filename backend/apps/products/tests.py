from decimal import Decimal

from django.test import TestCase

from apps.products.models import Category, Product
from apps.products.serializers import ProductListSerializer


class ProductImageUrlTests(TestCase):
    def test_remote_main_image_is_preserved_as_url(self):
        category = Category.objects.create(
            name='Smartphones',
            slug='smartphones',
            description='Mobile devices',
        )

        product = Product.objects.create(
            name='Sample Phone',
            slug='sample-phone',
            category=category,
            description='A sample product.',
            short_description='A sample phone',
            price=Decimal('1000.00'),
            stock_quantity=5,
            sku='SAMPLE-PHONE',
            brand='Test Brand',
            condition='new',
            warranty_months=12,
            main_image='https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80',
        )

        self.assertEqual(product.main_image, 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80')
        serializer_data = ProductListSerializer(product).data
        self.assertEqual(serializer_data['main_image'], product.main_image)
