from django.urls import path
from .views import (
    OrderListView,
    OrderDetailView,
    CreateOrderView,
    CancelOrderView,
    DeliveryOrdersView,
    AvailableDeliveryOrdersView,
    ClaimDeliveryOrderView,
    UpdateDeliveryStatusView,
)

urlpatterns = [
    path("", OrderListView.as_view(), name="orders"),
    path("create/", CreateOrderView.as_view(), name="create-order"),
    path("delivery/", DeliveryOrdersView.as_view(), name="delivery-orders"),
    path("delivery/available/", AvailableDeliveryOrdersView.as_view(), name="available-delivery-orders"),
    path("delivery/claim/<int:order_id>/", ClaimDeliveryOrderView.as_view(), name="claim-delivery-order"),
    path("delivery/update/<int:order_id>/", UpdateDeliveryStatusView.as_view(), name="update-delivery-status"),
    path("<int:pk>/", OrderDetailView.as_view(), name="order-detail"),
    path("<int:order_id>/cancel/", CancelOrderView.as_view(), name="cancel-order"),
]
