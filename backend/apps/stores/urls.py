from django.urls import path
from .views import (
    StoreListView,
    StoreDetailView,
    StoreProductsView,
    VendorStoreView,
    VendorAnalyticsView,
    VendorProductListCreateView,
    VendorProductDetailView,
    AdminStoreListView,
    AdminStoreDetailView,
)

urlpatterns = [
    path("", StoreListView.as_view(), name="store_list"),
    path("my-store/", VendorStoreView.as_view(), name="vendor_store"),
    path("my-store/analytics/", VendorAnalyticsView.as_view(), name="vendor_analytics"),
    path("my-store/products/", VendorProductListCreateView.as_view(), name="vendor_products"),
    path("my-store/products/<int:pk>/", VendorProductDetailView.as_view(), name="vendor_product_detail"),
    path("admin/list/", AdminStoreListView.as_view(), name="admin_store_list"),
    path("admin/<int:pk>/", AdminStoreDetailView.as_view(), name="admin_store_detail"),
    path("<str:identifier>/", StoreDetailView.as_view(), name="store_detail"),
    path("<str:identifier>/products/", StoreProductsView.as_view(), name="store_products"),
]
