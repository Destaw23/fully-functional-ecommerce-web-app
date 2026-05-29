import django_filters
from .models import Product


class ProductFilter(django_filters.FilterSet):
    # Filter by category slug (e.g. laptops), not numeric category id
    category = django_filters.CharFilter(field_name="category__slug", lookup_expr="iexact")
    min_price = django_filters.NumberFilter(field_name="price", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="price", lookup_expr="lte")
    brand = django_filters.CharFilter(field_name="brand", lookup_expr="iexact")
    condition = django_filters.ChoiceFilter(choices=Product.CONDITION_CHOICES)
    rating = django_filters.NumberFilter(field_name="rating", lookup_expr="gte")
    in_stock = django_filters.BooleanFilter(method="filter_in_stock")

    def filter_in_stock(self, queryset, name, value):
        if value:
            return queryset.filter(stock_quantity__gt=0)
        return queryset

    class Meta:
        model = Product
        fields = [
            "category",
            "brand",
            "condition",
            "min_price",
            "max_price",
            "rating",
            "in_stock",
        ]
