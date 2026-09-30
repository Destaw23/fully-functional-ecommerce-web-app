from rest_framework import generics, status, filters, serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import Q, Sum, Count
from django.shortcuts import get_object_or_404

from .models import Store
from .serializers import (
    StoreListSerializer,
    StoreDetailSerializer,
    StoreCreateUpdateSerializer,
    AdminStoreSerializer,
)
from apps.products.models import Product
from apps.products.serializers import ProductListSerializer
from apps.admin_dashboard.views import AdminProductSerializer
from apps.orders.models import OrderItem, Order


class StoreListView(generics.ListCreateAPIView):
    queryset = Store.objects.filter(is_active=True)
    serializer_class = StoreListSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filter_backends = [filters.SearchFilter]
    search_fields = ["name", "description", "city", "address"]

    def get_permissions(self):
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return StoreCreateUpdateSerializer
        return StoreListSerializer

    def get_queryset(self):
        queryset = Store.objects.filter(is_active=True)
        city = self.request.query_params.get("city")
        verified = self.request.query_params.get("verified")
        
        if city and city != "all":
            queryset = queryset.filter(city__iexact=city)
        if verified == "true":
            queryset = queryset.filter(is_verified=True)
        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        user.role = "store_owner"
        user.save(update_fields=["role"])
        serializer.save(owner=user)


class StoreDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, identifier):
        if identifier.isdigit():
            store = get_object_or_404(Store, pk=identifier)
        else:
            store = get_object_or_404(Store, slug=identifier)
        
        serializer = StoreDetailSerializer(store)
        return Response(serializer.data)


class StoreProductsView(generics.ListAPIView):
    serializer_class = ProductListSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ["name", "brand", "description"]

    def get_queryset(self):
        identifier = self.kwargs.get("identifier")
        if identifier.isdigit():
            store = get_object_or_404(Store, pk=identifier)
        else:
            store = get_object_or_404(Store, slug=identifier)
        
        queryset = Product.objects.filter(store=store, is_active=True)
        category_slug = self.request.query_params.get("category")
        if category_slug and category_slug != "all":
            queryset = queryset.filter(category__slug=category_slug)
        return queryset.order_by("-created_at")


class VendorStoreView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        store = Store.objects.filter(owner=request.user).first()
        if not store:
            return Response(
                {"detail": "You do not currently own a store."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = StoreDetailSerializer(store)
        return Response(serializer.data)

    def put(self, request):
        return self.update_store(request)

    def patch(self, request):
        return self.update_store(request, partial=True)

    def delete(self, request):
        store = Store.objects.filter(owner=request.user).first()
        if not store:
            return Response(
                {"detail": "Store not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        store.delete()
        return Response({"message": "Store successfully closed and removed."}, status=status.HTTP_200_OK)

    def update_store(self, request, partial=False):
        store = Store.objects.filter(owner=request.user).first()
        if not store:
            return Response(
                {"detail": "Store not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = StoreCreateUpdateSerializer(store, data=request.data, partial=partial)
        if serializer.is_valid():
            serializer.save()
            return Response(StoreDetailSerializer(store).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VendorAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        store = Store.objects.filter(owner=request.user).first()
        if not store:
            return Response(
                {"detail": "No store found for user."},
                status=status.HTTP_404_NOT_FOUND,
            )

        products = Product.objects.filter(store=store)
        total_products = products.count()
        low_stock = products.filter(stock_quantity__lt=10).count()
        out_of_stock = products.filter(stock_quantity=0).count()

        store_product_ids = products.values_list("id", flat=True)
        order_items = OrderItem.objects.filter(product_id__in=store_product_ids)

        total_sold = order_items.aggregate(total=Sum("quantity"))["total"] or 0
        total_revenue = order_items.aggregate(
            total=Sum("subtotal")
        )["total"] or 0

        return Response({
            "store": {
                "id": store.id,
                "name": store.name,
                "slug": store.slug,
                "is_verified": store.is_verified,
            },
            "analytics": {
                "total_products": total_products,
                "low_stock": low_stock,
                "out_of_stock": out_of_stock,
                "total_units_sold": total_sold,
                "total_revenue": total_revenue,
            }
        })


class VendorProductListCreateView(generics.ListCreateAPIView):
    serializer_class = AdminProductSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        store = Store.objects.filter(owner=self.request.user).first()
        if not store:
            return Product.objects.none()
        return Product.objects.filter(store=store).order_by("-created_at")

    def perform_create(self, serializer):
        store = Store.objects.filter(owner=self.request.user).first()
        if not store:
            raise serializers.ValidationError("User does not have a store.")
        serializer.save(store=store)


class VendorProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AdminProductSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        store = Store.objects.filter(owner=self.request.user).first()
        if not store:
            return Product.objects.none()
        return Product.objects.filter(store=store)


class AdminStoreListView(generics.ListCreateAPIView):
    queryset = Store.objects.all().order_by("-created_at")
    serializer_class = AdminStoreSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        if not (self.request.user.is_admin or self.request.user.is_superuser or self.request.user.is_staff):
            return Store.objects.none()
        return Store.objects.all().order_by("-created_at")


class AdminStoreDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Store.objects.all()
    serializer_class = AdminStoreSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        if not (self.request.user.is_admin or self.request.user.is_superuser or self.request.user.is_staff):
            return Store.objects.none()
        return Store.objects.all()

