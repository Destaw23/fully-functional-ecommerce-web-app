from django.shortcuts import render
from django.db import IntegrityError
from decimal import Decimal

# Create your views here.
from rest_framework import generics, status, filters
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Avg, Count
from apps.orders.models import OrderItem
from .models import Category, Product, Review, Wishlist
from .serializers import (
    CategorySerializer,
    ProductListSerializer,
    ProductDetailSerializer,
    ReviewSerializer,
    WishlistSerializer,
)
from .filters import ProductFilter


class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.filter(parent__isnull=True)
    serializer_class = CategorySerializer
    permission_classes = []


class CategoryDetailView(generics.RetrieveAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    lookup_field = "slug"
    permission_classes = []


class ProductListView(generics.ListAPIView):
    serializer_class = ProductListSerializer
    permission_classes = []
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_class = ProductFilter
    search_fields = ["name", "description", "brand"]
    ordering_fields = ["price", "rating", "created_at", "views_count"]

    def get_queryset(self):
        return Product.objects.filter(is_active=True)


class ProductDetailView(generics.RetrieveAPIView):
    queryset = Product.objects.filter(is_active=True)
    serializer_class = ProductDetailSerializer
    lookup_field = "slug"
    permission_classes = []

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.views_count += 1
        instance.save(update_fields=["views_count"])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class ReviewCreateView(generics.CreateAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]

    def validate_review_request(self, request):
        product_id = request.data.get("product")
        if not product_id:
            raise ValidationError({"product": "Product ID is required."})

        if Review.objects.filter(product_id=product_id, user=request.user).exists():
            raise ValidationError({"detail": "You have already reviewed this product."})

        has_delivered_order = OrderItem.objects.filter(
            order__user=request.user,
            order__status="delivered",
            product_id=product_id,
        ).exists()
        if not has_delivered_order:
            raise ValidationError(
                {"detail": "Only customers with a delivered order for this product can leave a review."}
            )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
        self.update_product_rating(serializer.instance.product)

    def update_product_rating(self, product):
        aggregate = product.reviews.aggregate(avg_rating=Avg("rating"), count=Count("id"))
        avg_rating = aggregate.get("avg_rating") or 0
        total_reviews = aggregate.get("count") or 0
        product.rating = Decimal(str(avg_rating)).quantize(Decimal("0.01"))
        product.total_reviews = total_reviews
        product.save(update_fields=["rating", "total_reviews"])

    def create(self, request, *args, **kwargs):
        self.validate_review_request(request)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            self.perform_create(serializer)
        except IntegrityError:
            raise ValidationError({"detail": "You have already reviewed this product."})

        headers = self.get_success_headers(serializer.data)
        product = serializer.instance.product
        response_data = {
            "review": serializer.data,
            "numReviews": product.total_reviews,
            "rating": float(product.rating or 0),
        }
        return Response(response_data, status=status.HTTP_201_CREATED, headers=headers)


class ReviewListView(generics.ListAPIView):
    serializer_class = ReviewSerializer
    permission_classes = []

    def get_queryset(self):
        product_slug = self.kwargs.get("product_slug")
        return Review.objects.filter(product__slug=product_slug)


class WishlistView(generics.ListCreateAPIView):
    serializer_class = WishlistSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        return Wishlist.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        product_id = request.data.get("product")
        if not product_id:
            raise ValidationError({"product": "Product ID is required."})

        existing = Wishlist.objects.filter(user=request.user, product_id=product_id).first()
        if existing:
            serializer = self.get_serializer(existing)
            return Response(serializer.data, status=status.HTTP_200_OK)

        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        product_id = self.request.data.get("product")
        try:
            serializer.save(user=self.request.user, product_id=product_id)
        except IntegrityError:
            raise ValidationError({"product": "This product is already in your wishlist."})

    def delete(self, request):
        product_id = request.data.get("product_id")
        if not product_id:
            return Response({"detail": "Product ID is required."}, status=status.HTTP_400_BAD_REQUEST)

        Wishlist.objects.filter(user=request.user, product_id=product_id).delete()
        return Response({"message": "Removed from wishlist"}, status=status.HTTP_200_OK)


class FeaturedProductsView(generics.ListAPIView):
    serializer_class = ProductListSerializer
    permission_classes = []

    def get_queryset(self):
        return Product.objects.filter(is_active=True, is_featured=True)[:8]
