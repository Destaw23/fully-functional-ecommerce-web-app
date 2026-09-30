import logging
from decimal import Decimal
from typing import Any, Optional

from django.http import HttpRequest

from .models import Order, TransactionLog

audit_logger = logging.getLogger("transactions")


def get_client_ip(request: Optional[HttpRequest]) -> Optional[str]:
    if not request:
        return None
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def record_transaction_log(
    *,
    event_type: str,
    reference: str,
    outcome: str = TransactionLog.Outcome.PENDING,
    order: Optional[Order] = None,
    user=None,
    request: Optional[HttpRequest] = None,
    amount: Optional[Decimal] = None,
    currency: str = "ETB",
    external_id: str = "",
    payment_method: str = "",
    message: str = "",
    metadata: Optional[dict[str, Any]] = None,
) -> TransactionLog:
    actor = user
    if actor is None and request and getattr(request, "user", None) and request.user.is_authenticated:
        actor = request.user

    entry = TransactionLog.objects.create(
        order=order,
        user=actor,
        event_type=event_type,
        outcome=outcome,
        amount=amount,
        currency=currency,
        reference=reference or (order.order_number if order else ""),
        external_id=external_id or "",
        payment_method=payment_method or "",
        message=message or "",
        metadata=metadata or {},
        ip_address=get_client_ip(request),
    )

    audit_logger.info(
        "event=%s outcome=%s ref=%s order=%s amount=%s user=%s msg=%s",
        event_type,
        outcome,
        entry.reference,
        order_id if (order_id := (order.id if order else None)) else "-",
        amount,
        getattr(actor, "id", None) if actor else "-",
        message,
    )
    return entry
