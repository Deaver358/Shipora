# Shipora money rules. All stored amounts are integer kobo.
DISPATCHER_COMMISSION_RATE = 0.12
VENDOR_SERVICE_FEE_RATE = 0.03
AUTO_RELEASE_HOURS = 24
PRE_ASSIGNMENT_CANCELLATION_FEE_RATE = 0.0
POST_ASSIGNMENT_CANCELLATION_FEE_RATE = 0.10


def kobo(naira: float) -> int:
    if naira < 0:
        raise ValueError("Amount cannot be negative")
    return int(round(naira * 100))


def compute_shipment_charges(delivery_fee_kobo: int) -> dict:
    service_fee = int(round(delivery_fee_kobo * VENDOR_SERVICE_FEE_RATE))
    commission = int(round(delivery_fee_kobo * DISPATCHER_COMMISSION_RATE))
    return {
        "delivery_fee": delivery_fee_kobo,
        "service_fee": service_fee,
        "platform_commission": commission,
        "vendor_total": delivery_fee_kobo + service_fee,
        "dispatcher_payout": delivery_fee_kobo - commission,
    }
