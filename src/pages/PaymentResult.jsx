import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../interceptors/api";
import { clearCached } from "../utils/appCache";
import "../index.css";

const MAX_ATTEMPTS = 5;

function PaymentResult() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // checking | success | pending | failed
  const [status, setStatus] = useState("checking");
  const [message, setMessage] = useState("");

  // Paystack appends ?trxref=...&reference=... to the callback URL
  const reference =
    searchParams.get("reference") || searchParams.get("trxref");
  const token = searchParams.get("token");
  const isTopUp = !token && String(reference || "").startsWith("SHP-TOPUP-");

  useEffect(() => {
    let cancelled = false;
    let timer = null;

    const verify = async (attempt = 1) => {
      try {
        if (token) {
          await api.get(`shipments/public/${encodeURIComponent(token)}/verify`, {
            params: reference ? { reference } : {},
          });
        } else if (isTopUp) {
          await api.get(
            `wallet/topup/verify/${encodeURIComponent(reference)}`
          );
          // the wallet balance shown on the dashboard is cached
          clearCached("wallet_balance");
          clearCached("wallet_transactions");
        } else {
          throw new Error("We couldn't find a payment to confirm.");
        }

        if (!cancelled) {
          setStatus("success");
        }
      } catch (err) {
        if (cancelled) return;

        const code = err?.response?.status;
        const detail = String(
          err?.response?.data?.detail || err?.message || ""
        );

        // Paystack can take a few seconds to confirm a payment
        const retryable =
          !code ||
          code >= 500 ||
          code === 409 ||
          (code === 400 && /could not be verified|not been completed/i.test(detail));

        if (retryable && attempt < MAX_ATTEMPTS) {
          timer = setTimeout(() => verify(attempt + 1), 2500);
          return;
        }

        setStatus(retryable ? "pending" : "failed");
        setMessage(
          detail ||
            "We couldn't confirm this payment yet. If you were charged, it will reflect shortly."
        );
      }
    };

    verify();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [reference, token, isTopUp]);

  if (status === "checking") {
    return (
      <main className="payment-result-page">
        <section className="payment-result-card">
          <div className="payment-loader"></div>

          <span className="page-eyebrow">
            PAYMENT
          </span>

          <h1>Confirming your payment</h1>

          <p>
            Please wait while we confirm your transaction.
          </p>
        </section>
      </main>
    );
  }

  if (status !== "success") {
    return (
      <main className="payment-result-page">
        <section className="payment-result-card">
          <span className="page-eyebrow">
            {status === "pending" ? "PAYMENT PENDING" : "PAYMENT NOT CONFIRMED"}
          </span>

          <h1>
            {status === "pending"
              ? "Still waiting for confirmation"
              : "Payment was not completed"}
          </h1>

          <p>{message}</p>

          {reference && (
            <div className="payment-reference">
              <span>PAYMENT REFERENCE</span>
              <strong>{reference}</strong>
            </div>
          )}

          <button
            className="full-primary-button"
            onClick={() =>
              token
                ? navigate(`/checkout/${token}`)
                : navigate(isTopUp ? "/top-up" : "/home")
            }
          >
            {status === "pending" ? "Back" : "Try Again"}
            <span>→</span>
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="payment-result-page">
      <section className="payment-result-card">

        <div className="payment-success-icon">
          ✓
        </div>

        <span className="page-eyebrow">
          PAYMENT CONFIRMED
        </span>

        <h1>Payment successful</h1>

        <p>
          {isTopUp
            ? "Your Shipora wallet has been topped up."
            : "Your shipment payment has been received. Your shipment will now continue through the delivery process."}
        </p>

        {reference && (
          <div className="payment-reference">
            <span>PAYMENT REFERENCE</span>
            <strong>{reference}</strong>
          </div>
        )}

        <button
          className="full-primary-button"
          onClick={() =>
            token
              ? navigate(`/checkout/${token}`)
              : navigate(isTopUp ? "/dashboard" : "/home")
          }
        >
          {isTopUp ? "Go to Wallet" : "View Shipment"}
          <span>→</span>
        </button>

      </section>
    </main>
  );
}

export default PaymentResult;
