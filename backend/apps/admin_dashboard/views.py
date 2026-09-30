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
from apps.orders.models import Order, OrderItem
from apps.products.models import Product, Category
from apps.products.models import ProductImage
from apps.accounts.models import User
from apps.stores.models import Store


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

        total_stores = Store.objects.count()

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
                    "total_stores": total_stores,
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
                "stores": {
                    "total": total_stores,
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
        report_type = request.query_params.get("type", "sales")
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = f"attachment; filename=admin_{report_type}_report.csv"
        writer = csv.writer(response)

        if report_type == "orders":
            writer.writerow(["Order Number", "Customer Email", "Status", "Payment Status", "Delivery Status", "Total Amount (ETB)", "Created At"])
            for order in Order.objects.all().order_by("-created_at"):
                writer.writerow([
                    order.order_number,
                    order.user.email if order.user else "N/A",
                    order.status,
                    order.payment_status,
                    order.delivery_status,
                    float(order.total_amount),
                    order.created_at.strftime("%Y-%m-%d %H:%M")
                ])
        elif report_type == "delivery":
            writer.writerow(["Order Number", "Tracking Code", "Delivery Status", "Courier Driver", "Customer Phone", "Shipping City", "Problem Reason", "Problem Notes"])
            for order in Order.objects.exclude(delivery_status="pending").order_by("-updated_at"):
                writer.writerow([
                    order.order_number,
                    order.tracking_code,
                    order.delivery_status,
                    order.assigned_delivery_person.username if order.assigned_delivery_person else "Unassigned",
                    order.shipping_phone,
                    order.shipping_city,
                    order.problem_reason or "None",
                    order.problem_notes or "None"
                ])
        elif report_type == "products":
            writer.writerow(["SKU", "Product Name", "Category", "Brand", "Price (ETB)", "Stock Quantity", "Is Active"])
            for p in Product.objects.all().order_by("name"):
                writer.writerow([
                    p.sku or f"SKU-{p.id}",
                    p.name,
                    p.category.name if p.category else "Uncategorized",
                    p.brand,
                    float(p.price),
                    p.stock_quantity,
                    "Yes" if p.is_active else "No"
                ])
        elif report_type == "users":
            writer.writerow(["User ID", "Username", "Email", "Role", "Is Active", "Date Joined"])
            for u in User.objects.all().order_by("-date_joined"):
                writer.writerow([
                    u.id,
                    u.username,
                    u.email,
                    u.role,
                    "Active" if u.is_active else "Deactivated",
                    u.date_joined.strftime("%Y-%m-%d %H:%M")
                ])
        else: # Default: Sales & Overview Report
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
    store_name = serializers.CharField(source="store.name", read_only=True, default="")
    countInStock = serializers.IntegerField(source="stock_quantity", read_only=True)
    main_image = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    additional_images_files = serializers.ListField(
        child=serializers.ImageField(), write_only=True, required=False
    )
    additional_images_meta = serializers.JSONField(write_only=True, required=False)

    class Meta:
        model = Product
        fields = "__all__"
        extra_kwargs = {
            "slug": {"required": False},
            "store": {"required": False, "allow_null": True},
        }

    def _has_main_image_upload(self):
        request = self.context.get("request")
        if not request or not getattr(request, "FILES", None):
            return False
        return bool(request.FILES.get("main_image") or request.FILES.get("image"))

    def to_internal_value(self, data):
        # Multipart file uploads bind to main_image before CharField validation runs.
        if self._has_main_image_upload():
            if hasattr(data, "copy"):
                data = data.copy()
            elif isinstance(data, dict):
                data = {**data}
            if hasattr(data, "pop"):
                data.pop("main_image", None)
                data.pop("image", None)
        return super().to_internal_value(data)

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

    def _apply_main_image_from_request(self, validated_data):
        request = self.context.get("request")
        main_file = None
        if request and request.FILES:
            main_file = request.FILES.get("main_image") or request.FILES.get("image")

        if main_file:
            from django.core.files.storage import default_storage

            saved_path = default_storage.save(f"products/{main_file.name}", main_file)
            validated_data["main_image"] = saved_path
        elif request and request.data:
            img_val = request.data.get("main_image") or request.data.get("image")
            if img_val and isinstance(img_val, str) and img_val.strip():
                validated_data["main_image"] = img_val.strip()

        return validated_data

    def create(self, validated_data):
        files = validated_data.pop("additional_images_files", None)
        meta = validated_data.pop("additional_images_meta", None)
        request = self.context.get("request")
        validated_data = self._apply_main_image_from_request(validated_data)

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
                    filename = entry.get('filename')
                    if filename:
                        match = None
                        for f in files_list:
                            if f.name == filename:
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

        primary = product.additional_images.filter(is_primary=True).first()
        if primary:
            product.main_image = str(primary.image)
            product.save(update_fields=['main_image'])

        return product

    def update(self, instance, validated_data):
        files = validated_data.pop("additional_images_files", None)
        meta = validated_data.pop("additional_images_meta", None)
        request = self.context.get("request")
        validated_data = self._apply_main_image_from_request(validated_data)

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
            product.main_image = str(primary.image)
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


class AdminOrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = "__all__"


class AdminOrderSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source="user.email", read_only=True)
    user_name = serializers.CharField(source="user.username", read_only=True)
    assigned_delivery_person_name = serializers.SerializerMethodField()
    items = AdminOrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = "__all__"

    def get_assigned_delivery_person_name(self, obj):
        if obj.assigned_delivery_person:
            u = obj.assigned_delivery_person
            return u.get_full_name() or u.username or u.email
        return None

    def update(self, instance, validated_data):
        assigned = validated_data.get("assigned_delivery_person", getattr(instance, "assigned_delivery_person", None))
        if assigned and instance.delivery_status == "pending" and "delivery_status" not in validated_data:
            validated_data["delivery_status"] = "assigned"
        return super().update(instance, validated_data)



class AdminUserSerializer(serializers.ModelSerializer):
    isAdmin = serializers.BooleanField(source="is_admin", read_only=True)
    name = serializers.CharField(source="username", read_only=True)
    _id = serializers.IntegerField(source="id", read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "_id",
            "username",
            "name",
            "email",
            "phone_number",
            "role",
            "address",
            "profile_picture",
            "is_active",
            "is_staff",
            "is_superuser",
            "isAdmin",
            "date_joined",
        )
        read_only_fields = ("email", "date_joined")

    def update(self, instance, validated_data):
        if "role" in validated_data:
            new_role = validated_data["role"]
            instance.role = new_role
            if new_role == "admin":
                instance.is_staff = True
            elif new_role in ["customer", "delivery", "store_owner"] and not instance.is_superuser:
                instance.is_staff = False
        return super().update(instance, validated_data)



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
    serializer_class = AdminOrderSerializer
    permission_classes = [IsAuthenticated, IsAdminPermission]
    pagination_class = None

    def get_queryset(self):
        qs = Order.objects.all().order_by("-created_at")
        delivery_status = self.request.query_params.get("delivery_status")
        if delivery_status and delivery_status != "all":
            if delivery_status == "assigned":
                qs = qs.filter(Q(assigned_delivery_person__isnull=False) | Q(delivery_status="assigned"))
            elif delivery_status == "unassigned":
                qs = qs.filter(assigned_delivery_person__isnull=True, delivery_status="pending")
            else:
                qs = qs.filter(delivery_status=delivery_status)
        return qs



class AdminOrderDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Order.objects.all()
    serializer_class = AdminOrderSerializer
    permission_classes = [IsAuthenticated, IsAdminPermission]


class AdminUserListView(generics.ListAPIView):
    serializer_class = AdminUserSerializer
    permission_classes = [IsAuthenticated, IsAdminPermission]
    pagination_class = None

    def get_queryset(self):
        qs = User.objects.all().order_by("-date_joined")
        role = self.request.query_params.get("role")
        if role and role != "all":
            qs = qs.filter(role=role)
        return qs



class AdminUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = AdminUserSerializer
    permission_classes = [IsAuthenticated, IsAdminPermission]

