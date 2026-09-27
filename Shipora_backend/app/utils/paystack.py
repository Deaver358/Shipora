import hashlib
import hmac
import httpx
from app.utils.config import settings

BASE_URL = "https://api.paystack.co"


def _headers() -> dict:
    return {
        "Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}",
        "Content-Type": "application/json",
    }


def verify_webhook_signature(raw_body: bytes, signature: str | None) -> bool:
    if not settings.PAYSTACK_SECRET_KEY or not signature:
        return False
    expected = hmac.new(settings.PAYSTACK_SECRET_KEY.encode(), raw_body, hashlib.sha512).hexdigest()
    return hmac.compare_digest(expected, signature)


async def initialize_transaction(email: str, amount_kobo: int, reference: str, callback_url: str | None = None) -> dict:
    if not settings.PAYSTACK_SECRET_KEY:
        raise RuntimeError("PAYSTACK_SECRET_KEY is not configured")
    payload = {"email": email, "amount": amount_kobo, "reference": reference}
    if callback_url:
        payload["callback_url"] = callback_url
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(f"{BASE_URL}/transaction/initialize", headers=_headers(), json=payload)
        response.raise_for_status()
        data = response.json()
        if not data.get("status"):
            raise RuntimeError(data.get("message", "Paystack initialization failed"))
        return data["data"]


async def verify_transaction(reference: str) -> dict:
    if not settings.PAYSTACK_SECRET_KEY:
        raise RuntimeError("PAYSTACK_SECRET_KEY is not configured")
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.get(f"{BASE_URL}/transaction/verify/{reference}", headers=_headers())
        response.raise_for_status()
        data = response.json()
        return data["data"]


async def refund_transaction(reference: str, amount_kobo: int | None = None) -> dict:
    if not settings.PAYSTACK_SECRET_KEY:
        raise RuntimeError("PAYSTACK_SECRET_KEY is not configured")
    payload = {"transaction": reference}
    if amount_kobo is not None:
        payload["amount"] = amount_kobo
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(f"{BASE_URL}/refund", headers=_headers(), json=payload)
        response.raise_for_status()
        return response.json()["data"]


async def create_transfer_recipient(name: str, account_number: str, bank_code: str) -> str:
    if not settings.PAYSTACK_SECRET_KEY:
        raise RuntimeError("PAYSTACK_SECRET_KEY is not configured")
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            f"{BASE_URL}/transferrecipient",
            headers=_headers(),
            json={"type": "nuban", "name": name, "account_number": account_number, "bank_code": bank_code, "currency": "NGN"},
        )
        response.raise_for_status()
        return response.json()["data"]["recipient_code"]


async def list_banks() -> list[dict]:
    if not settings.PAYSTACK_SECRET_KEY:
        raise RuntimeError("PAYSTACK_SECRET_KEY is not configured")
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.get(f"{BASE_URL}/bank", headers=_headers(), params={"currency": "NGN"})
        response.raise_for_status()
        return response.json()["data"]


async def resolve_account_number(account_number: str, bank_code: str) -> dict:
    """Returns {'account_number': ..., 'account_name': ..., 'bank_id': ...} if the account is real."""
    if not settings.PAYSTACK_SECRET_KEY:
        raise RuntimeError("PAYSTACK_SECRET_KEY is not configured")
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.get(
            f"{BASE_URL}/bank/resolve",
            headers=_headers(),
            params={"account_number": account_number, "bank_code": bank_code},
        )
        if response.status_code >= 400:
            data = response.json()
            raise RuntimeError(data.get("message", "Could not verify this account number."))
        return response.json()["data"]


async def initiate_transfer(recipient_code: str, amount_kobo: int, reason: str, reference: str) -> dict:
    if not settings.PAYSTACK_SECRET_KEY:
        raise RuntimeError("PAYSTACK_SECRET_KEY is not configured")
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            f"{BASE_URL}/transfer",
            headers=_headers(),
            json={"source": "balance", "recipient": recipient_code, "amount": amount_kobo, "reason": reason, "reference": reference},
        )
        response.raise_for_status()
        return response.json()["data"]
