from django.shortcuts import render
import csv
from django.http import HttpResponse

# Create your views here.
from rest_framework import status, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import datetime, time, timedelta
from apps.orders.models import Order
from apps.products.models import Product, Category
from apps.products.models import ProductImage
from apps.accounts.models import User


def get_day_bounds(day):
    start = timezone.make_aware(datetime.combine(day, time.min))
    end = start + timedelta(days=1)
    return start, end


class IsAdminPermission(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_admin


class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminPermission]

    def get(self, request):
        today = timezone.localdate()
        today_start, today_end = get_day_bounds(today)
        week_start = timezone.now() - timedelta(days=7)
        month_start = timezone.now() - timedelta(days=30)

        # Sales statistics
        total_orders = Order.objects.count()
        total_revenue = (
            Order.objects.filter(Q(payment_status="paid") | Q(status="delivered")).aggregate(
                total=Sum("total_amount")
            )["total"]
            or 0
        )

        pending_orders = Order.objects.filter(status="pending").count()
        processing_orders = Order.objects.filter(status="processing").count()

        # Weekly sales
        weekly_orders = Order.objects.filter(created_at__gte=week_start).count()
        weekly_revenue = (
            Order.objects.filter(
                Q(payment_status="paid") | Q(status="delivered"),
                created_at__gte=week_start,
            ).aggregate(total=Sum("total_amount"))["total"]
            or 0
        )

        # Monthly sales
        monthly_orders = Order.objects.filter(created_at__gte=month_start).count()
        monthly_revenue = (
            Order.objects.filter(
                Q(payment_status="paid") | Q(status="delivered"),
                created_at__gte=month_start,
            ).aggregate(total=Sum("total_amount"))["total"]
            or 0
        )

        # Product statistics
        total_products = Product.objects.count()
        low_stock = Product.objects.filter(stock_quantity__lt=10).count()
        out_of_stock = Product.objects.filter(stock_quantity=0).count()

        # User statistics
        total_users = User.objects.count()
        new_users_today = User.objects.filter(date_joined__gte=today_start, date_joined__lt=today_end).count()

        # Top selling products
        top_products = (
            Product.objects.filter(orderitem__isnull=False)
            .annotate(total_sold=Sum("orderitem__quantity"))
            .order_by("-total_sold")[:5]
        )

        top_products_data = []
        for product in top_products:
            top_products_data.append(
                {
                    "id": product.id,
                    "name": product.name,
                    "total_sold": product.total_sold or 0,
                    "revenue": product.total_sold * product.price
                    if product.total_sold
                    else 0,
                }
            )

        return Response(
            {
                "overview": {
                    "total_orders": total_orders,
                    "total_revenue": total_revenue,
                    "pending_orders": pending_orders,
                    "processing_orders": processing_orders,
                },
                "weekly": {
                    "orders": weekly_orders,
                    "revenue": weekly_revenue,
                },
                "monthly": {
                    "orders": monthly_orders,
                    "revenue": monthly_revenue,
                },
                "products": {
                    "total": total_products,
                    "low_stock": low_stock,
                    "out_of_stock": out_of_stock,
                },
                "users": {
                    "total": total_users,
                    "new_today": new_users_today,
                },
                "top_products": top_products_data,
            }
        )


class SalesChartView(APIView):
    permission_classes = [IsAuthenticated, IsAdminPermission]

    def get(self, request):
        days = max(int(request.query_params.get("days", 30)), 1)
        start_date = timezone.localdate() - timedelta(days=days - 1)

        sales_data = []
        for i in range(days):
            date = start_date + timedelta(days=i)
            day_start, day_end = get_day_bounds(date)
            daily_sales = (
                Order.objects.filter(
                    Q(payment_status="paid") | Q(status="delivered"),
                    created_at__gte=day_start,
                    created_at__lt=day_end,
                ).aggregate(total=Sum("total_amount"))["total"]
                or 0
            )

            sales_data.append(
                {
                    "date": date.strftime("%Y-%m-%d"),
                    "sales": float(daily_sales),
                    "orders": Order.objects.filter(created_at__gte=day_start, created_at__lt=day_end).count(),
                }
            )

        return Response(sales_data)


class ReportExportView(APIView):
    permission_classes = [IsAuthenticated, IsAdminPermission]

    def get(self, request):
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = "attachment; filename=admin_report.csv"

        writer = csv.writer(response)
        writer.writerow(["Metric", "Value"])

        total_orders = Order.objects.count()
        total_revenue = (
            Order.objects.filter(Q(payment_status="paid") | Q(status="delivered")).aggregate(total=Sum("total_amount"))["total"]
            or 0
        )
        pending_orders = Order.objects.filter(status="pending").count()
        shipped_orders = Order.objects.filter(status="shipped").count()
        delivered_orders = Order.objects.filter(status="delivered").count()

        writer.writerow(["Total orders", total_orders])
        writer.writerow(["Total revenue", float(total_revenue)])
        writer.writerow(["Pending orders", pending_orders])
        writer.writerow(["Shipped orders", shipped_orders])
        writer.writerow(["Delivered orders", delivered_orders])

        writer.writerow([])
        writer.writerow(["Top selling products"])
        writer.writerow(["Product", "Units sold", "Revenue"])
        for product in (
            Product.objects.filter(orderitem__isnull=False)
            .annotate(total_sold=Sum("orderitem__quantity"))
            .order_by("-total_sold")[:10]
        ):
            writer.writerow([product.name, product.total_sold or 0, float((product.total_sold or 0) * product.price)])

        return response


# Serializers for Administrative Dashboard CRUD
from rest_framework import generics, serializers
from django.utils.text import slugify


class AdminProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    countInStock = serializers.IntegerField(source="stock_quantity", read_only=True)
    additional_images_files = serializers.ListField(
        child=serializers.ImageField(), write_only=True, required=False
    )
    additional_images_meta = serializers.JSONField(write_only=True, required=False)

    class Meta:
        model = Product
        fields = "__all__"
        extra_kwargs = {"slug": {"required": False}}

    def validate(self, attrs):
        if not attrs.get("slug") and attrs.get("name"):
            base_slug = slugify(attrs["name"])
            slug = base_slug
            counter = 1
            while Product.objects.filter(slug=slug).exists():
                if self.instance and self.instance.slug == slug:
                    break
                slug = f"{base_slug}-{counter}"
                counter += 1
            attrs["slug"] = slug
        return attrs

    def create(self, validated_data):
        files = validated_data.pop("additional_images_files", None)
        meta = validated_data.pop("additional_images_meta", None)
        request = self.context.get('request')
        product = super().create(validated_data)

        files_list = []
        if request:
            files_list = request.FILES.getlist('additional_images_files')

        # First, create ProductImage entries for uploaded files
        if files_list:
            for f in files_list:
                ProductImage.objects.create(product=product, image=f)

        # Then process metadata for existing images (alt_text, is_primary, delete)
        if meta and isinstance(meta, list):
            # Update existing images or set primary/alt for newly created ones by filename
            # No pre-built filename map needed; we'll match newly created images by filename below
            # Process each meta entry
            for entry in meta:
                if not isinstance(entry, dict):
                    continue
                img_id = entry.get('id')
                if img_id:
                    try:
                        pi = ProductImage.objects.get(id=img_id, product=product)
                    except ProductImage.DoesNotExist:
                        continue
                    if entry.get('delete'):
                        pi.delete()
                        continue
                    if 'alt_text' in entry:
                        pi.alt_text = entry.get('alt_text') or ''
                    if 'is_primary' in entry:
                        pi.is_primary = bool(entry.get('is_primary'))
                    pi.save()
                else:
                    # For new uploads, match by filename
                    filename = entry.get('filename')
                    if filename:
                        match = None
                        for f in files_list:
                            if f.name == filename:
                                # find the ProductImage created for this file by comparing file name in image field
                                match = ProductImage.objects.filter(product=product, image__contains=filename).order_by('-id').first()
                                break
                        if match:
                            if entry.get('delete'):
                                match.delete()
                                continue
                            if 'alt_text' in entry:
                                match.alt_text = entry.get('alt_text') or ''
                            if 'is_primary' in entry:
                                match.is_primary = bool(entry.get('is_primary'))
                            match.save()

        # Ensure a single primary image: if any ProductImage marked primary, set product.main_image accordingly
        primary = product.additional_images.filter(is_primary=True).first()
        if primary:
            product.main_image = primary.image
            product.save(update_fields=['main_image'])

        return product

    def update(self, instance, validated_data):
        files = validated_data.pop("additional_images_files", None)
        meta = validated_data.pop("additional_images_meta", None)
        request = self.context.get('request')
        product = super().update(instance, validated_data)

        files_list = []
        if request:
            files_list = request.FILES.getlist('additional_images_files')

        # Create new ProductImage for uploaded files
        if files_list:
            for f in files_list:
                ProductImage.objects.create(product=product, image=f)

        # Process metadata for existing images
        if meta and isinstance(meta, list):
            for entry in meta:
                if not isinstance(entry, dict):
                    continue
                img_id = entry.get('id')
                if img_id:
                    try:
                        pi = ProductImage.objects.get(id=img_id, product=product)
                    except ProductImage.DoesNotExist:
                        continue
                    if entry.get('delete'):
                        pi.delete()
                        continue
                    if 'alt_text' in entry:
                        pi.alt_text = entry.get('alt_text') or ''
                    if 'is_primary' in entry:
                        pi.is_primary = bool(entry.get('is_primary'))
                    pi.save()
                else:
                    # For new uploads match by filename
                    filename = entry.get('filename')
                    if filename:
                        match = ProductImage.objects.filter(product=product, image__contains=filename).order_by('-id').first()
                        if match:
                            if entry.get('delete'):
                                match.delete()
                                continue
                            if 'alt_text' in entry:
                                match.alt_text = entry.get('alt_text') or ''
                            if 'is_primary' in entry:
                                match.is_primary = bool(entry.get('is_primary'))
                            match.save()

        # Ensure single primary
        ProductImage.objects.filter(product=product, is_primary=True).exclude(id=ProductImage.objects.filter(product=product, is_primary=True).first().id if ProductImage.objects.filter(product=product, is_primary=True).exists() else None).update(is_primary=False)
        primary = product.additional_images.filter(is_primary=True).first()
        if primary:
            product.main_image = primary.image
            product.save(update_fields=['main_image'])

        return product


class AdminCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = "__all__"
        extra_kwargs = {"slug": {"required": False}}

    def validate(self, attrs):
        if not attrs.get("slug") and attrs.get("name"):
            base_slug = slugify(attrs["name"])
            slug = base_slug
            counter = 1
            while Category.objects.filter(slug=slug).exists():
                if self.instance and self.instance.slug == slug:
                    break
                slug = f"{base_slug}-{counter}"
                counter += 1
            attrs["slug"] = slug
        return attrs


class AdminOrderSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = Order
        fields = "__all__"


class AdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "phone_number",
            "role",
            "address",
            "profile_picture",
            "is_active",
            "date_joined",
        )
        read_only_fields = ("email", "date_joined")


# Administrative CRUD Views
class AdminProductListCreateView(generics.ListCreateAPIView):
    queryset = Product.objects.all().order_by("-created_at")
    serializer_class = AdminProductSerializer
    permission_classes = [IsAuthenticated, IsAdminPermission]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filter_backends = [filters.SearchFilter]
    search_fields = ["name", "brand", "sku"]


class AdminProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all()
    serializer_class = AdminProductSerializer
    permission_classes = [IsAuthenticated, IsAdminPermission]
    parser_classes = [MultiPartParser, FormParser, JSONParser]


class AdminCategoryListCreateView(generics.ListCreateAPIView):
    queryset = Category.objects.all().order_by("name")
    serializer_class = AdminCategorySerializer
    permission_classes = [IsAuthenticated, IsAdminPermission]


class AdminCategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Category.objects.all()
    serializer_class = AdminCategorySerializer
    permission_classes = [IsAuthenticated, IsAdminPermission]


class AdminOrderListView(generics.ListAPIView):
    queryset = Order.objects.all().order_by("-created_at")
    serializer_class = AdminOrderSerializer
    permission_classes = [IsAuthenticated, IsAdminPermission]


class AdminOrderDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Order.objects.all()
    serializer_class = AdminOrderSerializer
    permission_classes = [IsAuthenticated, IsAdminPermission]


class AdminUserListView(generics.ListAPIView):
    queryset = User.objects.all().order_by("-date_joined")
    serializer_class = AdminUserSerializer
    permission_classes = [IsAuthenticated, IsAdminPermission]


class AdminUserDetailView(generics.RetrieveUpdateAPIView):
    queryset = User.objects.all()
    serializer_class = AdminUserSerializer
    permission_classes = [IsAuthenticated, IsAdminPermission]

