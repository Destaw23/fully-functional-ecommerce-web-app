from django.urls import path
from .views import (
    DashboardStatsView,
    SalesChartView,
    ReportExportView,
    AdminProductListCreateView,
    AdminProductDetailView,
    AdminCategoryListCreateView,
    AdminCategoryDetailView,
    AdminOrderListView,
    AdminOrderDetailView,
    AdminUserListView,
    AdminUserDetailView,
)

urlpatterns = [
    path("stats/", DashboardStatsView.as_view(), name="dashboard-stats"),
    path("sales-chart/", SalesChartView.as_view(), name="sales-chart"),
    path("report/export/", ReportExportView.as_view(), name="report-export"),
    path("products/", AdminProductListCreateView.as_view(), name="admin-products"),
    path(
        "products/<int:pk>/",
        AdminProductDetailView.as_view(),
        name="admin-product-detail",
    ),
    path("categories/", AdminCategoryListCreateView.as_view(), name="admin-categories"),
    path(
        "categories/<int:pk>/",
        AdminCategoryDetailView.as_view(),
        name="admin-category-detail",
    ),
    path("orders/", AdminOrderListView.as_view(), name="admin-orders"),
    path(
        "orders/<int:pk>/", AdminOrderDetailView.as_view(), name="admin-order-detail"
    ),
    path("users/", AdminUserListView.as_view(), name="admin-users"),
    path("users/<int:pk>/", AdminUserDetailView.as_view(), name="admin-user-detail"),
]
