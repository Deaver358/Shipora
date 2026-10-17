import asyncio
import hashlib
import hmac
import logging
import time

import httpx
from app.utils.config import settings

BASE_URL = "https://api.paystack.co"
logger = logging.getLogger("shipora.paystack")


class PaystackError(RuntimeError):
    """
    Raised for any Paystack failure. ``definitive`` is True when Paystack
    answered and refused the request (4xx), False when the outcome is
    unknown (timeout, network error, 5xx) and the call may have succeeded.
    """

    def __init__(self, message: str, status_code: int | None = None, definitive: bool = False):
        super().__init__(message)
        self.status_code = status_code
        self.definitive = definitive


def _headers() -> dict:
    return {
        "Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}",
        "Content-Type": "application/json",
    }


def _require_key():
    if not settings.PAYSTACK_SECRET_KEY:
        raise PaystackError("Payments are not configured yet (PAYSTACK_SECRET_KEY is missing).", definitive=True)


async def _request(method: str, path: str, *, retries: int = 0, **kwargs) -> dict:
    """
    Calls Paystack and returns the parsed JSON body.

    Only idempotent calls (GET) are retried; money-moving POSTs are never
    retried automatically to avoid duplicate charges / transfers.
    """
    _require_key()
    last_error: Exception | None = None

    for attempt in range(retries + 1):
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.request(method, f"{BASE_URL}{path}", headers=_headers(), **kwargs)
        except httpx.RequestError as exc:
            last_error = PaystackError(
                "Could not reach Paystack. Please try again shortly.", definitive=False
            )
            logger.warning("Paystack %s %s network error: %s", method, path, exc)
        else:
            try:
                body = response.json()
            except ValueError:
                body = {}

            if response.status_code >= 500:
                last_error = PaystackError(
                    body.get("message") or "Paystack is temporarily unavailable. Please try again.",
                    status_code=response.status_code,
                    definitive=False,
                )
                logger.warning("Paystack %s %s -> %s", method, path, response.status_code)
            elif response.status_code >= 400 or body.get("status") is False:
                raise PaystackError(
                    body.get("message") or f"Paystack rejected the request ({response.status_code}).",
                    status_code=response.status_code,
                    definitive=True,
                )
            else:
                return body

        if attempt < retries:
            await asyncio.sleep(0.5 * (2 ** attempt))

    raise last_error  # type: ignore[misc]


def verify_webhook_signature(raw_body: bytes, signature: str | None) -> bool:
    if not settings.PAYSTACK_SECRET_KEY or not signature:
        return False
    expected = hmac.new(settings.PAYSTACK_SECRET_KEY.encode(), raw_body, hashlib.sha512).hexdigest()
    return hmac.compare_digest(expected, signature)


async def initialize_transaction(email: str, amount_kobo: int, reference: str, callback_url: str | None = None) -> dict:
    payload = {"email": email, "amount": amount_kobo, "reference": reference}
    if callback_url:
        payload["callback_url"] = callback_url
    body = await _request("POST", "/transaction/initialize", json=payload)
    return body["data"]


async def verify_transaction(reference: str) -> dict:
    body = await _request("GET", f"/transaction/verify/{reference}", retries=2)
    return body.get("data") or {}


async def refund_transaction(reference: str, amount_kobo: int | None = None) -> dict:
    payload = {"transaction": reference}
    if amount_kobo is not None:
        payload["amount"] = amount_kobo
    body = await _request("POST", "/refund", json=payload)
    return body["data"]


async def create_transfer_recipient(name: str, account_number: str, bank_code: str) -> str:
    body = await _request(
        "POST",
        "/transferrecipient",
        json={"type": "nuban", "name": name, "account_number": account_number, "bank_code": bank_code, "currency": "NGN"},
    )
    return body["data"]["recipient_code"]


_BANKS_CACHE: dict = {"at": 0.0, "data": None}
_BANKS_TTL_SECONDS = 24 * 60 * 60


async def list_banks() -> list[dict]:
    # The bank list rarely changes; cache it so the bank-account page keeps
    # working even if Paystack is briefly unavailable.
    now = time.time()
    if _BANKS_CACHE["data"] and now - _BANKS_CACHE["at"] < _BANKS_TTL_SECONDS:
        return _BANKS_CACHE["data"]
    try:
        body = await _request("GET", "/bank", params={"currency": "NGN"}, retries=2)
    except PaystackError:
        if _BANKS_CACHE["data"]:
            return _BANKS_CACHE["data"]
        raise
    _BANKS_CACHE.update(at=now, data=body["data"])
    return body["data"]


async def resolve_account_number(account_number: str, bank_code: str) -> dict:
    """Returns {'account_number': ..., 'account_name': ..., 'bank_id': ...} if the account is real."""
    try:
        body = await _request(
            "GET",
            "/bank/resolve",
            params={"account_number": account_number, "bank_code": bank_code},
            retries=1,
        )
    except PaystackError as exc:
        if exc.definitive:
            raise PaystackError(str(exc) or "Could not verify this account number.", exc.status_code, True)
        raise
    return body["data"]


async def initiate_transfer(recipient_code: str, amount_kobo: int, reason: str, reference: str) -> dict:
    body = await _request(
        "POST",
        "/transfer",
        json={"source": "balance", "recipient": recipient_code, "amount": amount_kobo, "reason": reason, "reference": reference},
    )
    return body["data"]
