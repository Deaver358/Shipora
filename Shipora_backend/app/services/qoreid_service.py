import time
from typing import Any

import httpx

from app.utils.config import settings


class QoreIDService:
    """
    Shipora's QoreID integration.

    Credentials stay server-side in .env.
    QoreID access tokens are cached for their lifetime.
    """

    _access_token: str | None = None
    _token_expires_at: float = 0

    @classmethod
    async def _get_access_token(cls) -> str:
        now = time.time()

        # Reuse the token while it is still valid.
        # Refresh 60 seconds early.
        if cls._access_token and now < cls._token_expires_at - 60:
            return cls._access_token

        if not settings.KYC_CLIENT_ID or not settings.KYC_CLIENT_SECRET:
            raise RuntimeError("QoreID credentials are not configured.")

        base_url = settings.KYC_PROVIDER_BASE_URL.rstrip("/")

        async with httpx.AsyncClient(
    timeout=30,
    transport=httpx.AsyncHTTPTransport(
        local_address="0.0.0.0"
    ),
) as client:
            response = await client.post(
                f"{base_url}/token",
                json={
                    "clientId": settings.KYC_CLIENT_ID,
                    "secret": settings.KYC_CLIENT_SECRET,
                },
            )

            response.raise_for_status()
            body = response.json()

        access_token = body.get("accessToken")

        if not access_token:
            raise RuntimeError("QoreID did not return an access token.")

        expires_in = body.get("expiresIn", 7200)

        if isinstance(expires_in, str):
            try:
                expires_seconds = int(
                    expires_in.lower().replace("secs", "").strip()
                )
            except ValueError:
                expires_seconds = 7200
        else:
            expires_seconds = int(expires_in)

        cls._access_token = access_token
        cls._token_expires_at = time.time() + expires_seconds

        return access_token

    @classmethod
    async def _post(
        cls,
        path: str,
        payload: dict[str, Any] | None = None,
    ) -> dict[str, Any]:

        token = await cls._get_access_token()

        base_url = settings.KYC_PROVIDER_BASE_URL.rstrip("/")

        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
        }

        async with httpx.AsyncClient(
    timeout=30,
    transport=httpx.AsyncHTTPTransport(
        local_address="0.0.0.0"
    ),
) as client:
            response = await client.post(
                f"{base_url}{path}",
                json=payload or {},
                headers=headers,
            )

            # If QoreID says our cached token expired, refresh once.
            if response.status_code == 401:
                cls._access_token = None
                cls._token_expires_at = 0

                token = await cls._get_access_token()
                headers["Authorization"] = f"Bearer {token}"

                response = await client.post(
                    f"{base_url}{path}",
                    json=payload or {},
                    headers=headers,
                )

            response.raise_for_status()

            body = response.json()

            if not isinstance(body, dict):
                raise ValueError("Unexpected QoreID response.")

            return body

    @staticmethod
    def _status(body: dict[str, Any]) -> str:
        status = body.get("status")

        if isinstance(status, dict):
            return str(status.get("status") or "").strip().lower()

        return str(status or "").strip().lower()

    @staticmethod
    def _reference(body: dict[str, Any]) -> str | None:
        value = (
            body.get("id")
            or body.get("reference")
            or body.get("requestId")
            or body.get("request_id")
        )

        return str(value) if value is not None else None

    @staticmethod
    def _normalise(value: Any) -> str:
        return " ".join(
            str(value or "").strip().upper().split()
        )

    @classmethod
    async def verify_nin(
        cls,
        nin: str,
        first_name: str,
        surname: str,
    ) -> tuple[str, str | None]:

        if not nin:
            return "rejected", None

        try:
            body = await cls._post(
                f"/v1/ng/identities/nin/{nin}",
                {
                    "firstname": first_name,
                    "lastname": surname,
                },
            )

            reference = cls._reference(body)
            provider_status = cls._status(body)

            if provider_status in {
                "rejected",
                "failed",
                "declined",
                "invalid",
                "not_found",
            }:
                return "rejected", reference

            if provider_status in {
                "pending",
                "processing",
                "review",
                "review_required",
            }:
                return "review_required", reference

            nin_data = body.get("nin") or {}
            applicant = body.get("applicant") or {}
            summary = body.get("summary") or {}
            nin_check = summary.get("nin_check") or {}

            provider_first = (
                nin_data.get("firstname")
                or applicant.get("firstname")
            )

            provider_last = (
                nin_data.get("lastname")
                or applicant.get("lastname")
            )

            exact_match = (
                str(nin_check.get("status", "")).upper()
                == "EXACT_MATCH"
            )

            names_match = (
                cls._normalise(provider_first)
                == cls._normalise(first_name)
                and cls._normalise(provider_last)
                == cls._normalise(surname)
            )

            if provider_status == "verified" and exact_match and names_match:
                return "verified", reference

            if provider_status in {
                "verified",
                "success",
                "successful",
                "completed",
            }:
                return (
                    "verified" if names_match else "rejected",
                    reference,
                )

            return "review_required", reference

        except httpx.HTTPStatusError as exc:
            if exc.response.status_code in {400, 404, 422}:
                return "rejected", None

            return "review_required", None

        except (httpx.RequestError, ValueError, TypeError, RuntimeError):
            return "review_required", None

    @classmethod
    async def verify_cac(
        cls,
        cac_number: str,
        business_name: str,
    ) -> tuple[str, str | None]:

        if not cac_number:
            return "pending", None

        try:
            body = await cls._post(
                "/v1/ng/identities/cac-basic",
                {
                    "regNumber": cac_number,
                },
            )

            reference = cls._reference(body)
            provider_status = cls._status(body)

            if provider_status in {
                "rejected",
                "failed",
                "declined",
                "invalid",
                "not_found",
            }:
                return "rejected", reference

            if provider_status in {
                "pending",
                "processing",
                "review",
                "review_required",
            }:
                return "review_required", reference

            cac_data = body.get("cac") or {}
            company_name = cac_data.get("companyName")

            summary = body.get("summary") or {}
            cac_check = str(
                summary.get("cac_check") or ""
            ).lower()

            name_matches = (
                cls._normalise(company_name)
                == cls._normalise(business_name)
            )

            if (
                provider_status == "verified"
                and cac_check == "verified"
                and name_matches
            ):
                return "verified", reference

            if provider_status in {
                "verified",
                "success",
                "successful",
                "completed",
            }:
                return (
                    "verified" if name_matches else "review_required",
                    reference,
                )

            return "review_required", reference

        except httpx.HTTPStatusError as exc:
            if exc.response.status_code in {400, 404, 422}:
                return "rejected", None

            return "review_required", None

        except (httpx.RequestError, ValueError, TypeError, RuntimeError):
            return "review_required", None

    @classmethod
    async def verify_drivers_licence(
        cls,
        licence_number: str,
        first_name: str,
        surname: str,
    ) -> tuple[str, str | None]:

        if not licence_number:
            return "rejected", None

        try:
            body = await cls._post(
                f"/v1/ng/identities/driver-license/{licence_number}",
                {
                    "fistname": first_name,
                    "lastname": surname,
                },
            )

            reference = cls._reference(body)
            provider_status = cls._status(body)

            if provider_status in {
                "rejected",
                "failed",
                "declined",
                "invalid",
                "not_found",
            }:
                return "rejected", reference

            if provider_status in {
                "pending",
                "processing",
                "review",
                "review_required",
            }:
                return "review_required", reference

            licence_data = body.get("drivers_license") or {}
            applicant = body.get("applicant") or {}

            provider_first = (
                licence_data.get("firstname")
                or applicant.get("firstname")
            )

            provider_last = (
                licence_data.get("lastname")
                or applicant.get("lastname")
            )

            summary = body.get("summary") or {}
            licence_check = summary.get(
                "drivers_license_check"
            ) or {}

            exact_match = (
                str(licence_check.get("status", "")).upper()
                == "EXACT_MATCH"
            )

            names_match = (
                cls._normalise(provider_first)
                == cls._normalise(first_name)
                and cls._normalise(provider_last)
                == cls._normalise(surname)
            )

            if (
                provider_status == "verified"
                and exact_match
                and names_match
            ):
                return "verified", reference

            if provider_status in {
                "verified",
                "success",
                "successful",
                "completed",
            }:
                return (
                    "verified" if names_match else "rejected",
                    reference,
                )

            return "review_required", reference

        except httpx.HTTPStatusError as exc:
            if exc.response.status_code in {400, 404, 422}:
                return "rejected", None

            return "review_required", None

        except (httpx.RequestError, ValueError, TypeError, RuntimeError):
            return "review_required", None

    @classmethod
    async def verify_license_plate(
        cls,
        plate_number: str,
    ) -> tuple[str, str | None, dict[str, Any]]:

        if not plate_number:
            return "rejected", None, {}

        try:
            body = await cls._post(
                f"/v1/ng/identities/license-plate-basic/{plate_number}",
                {},
            )

            reference = cls._reference(body)
            provider_status = cls._status(body)

            if provider_status in {
                "rejected",
                "failed",
                "declined",
                "invalid",
                "not_found",
            }:
                return "rejected", reference, body

            if provider_status in {
                "pending",
                "processing",
                "review",
                "review_required",
            }:
                return "review_required", reference, body

            if provider_status in {
                "verified",
                "success",
                "successful",
                "completed",
            }:
                return "verified", reference, body

            return "review_required", reference, body

        except httpx.HTTPStatusError as exc:
            if exc.response.status_code in {400, 404, 422}:
                return "rejected", None, {}

            return "review_required", None, {}

        except (httpx.RequestError, ValueError, TypeError, RuntimeError):
            return "review_required", None, {}
