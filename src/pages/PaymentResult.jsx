import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import "../index.css";

function PaymentResult() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState("checking");

  const reference = searchParams.get("reference");
  const token = searchParams.get("token");

  useEffect(() => {
    // Backend payment verification will be connected here.
    const timer = setTimeout(() => {
      setStatus("success");
    }, 800);

    return () => clearTimeout(timer);
  }, [reference]);

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
          Your shipment payment has been received.
          Your shipment will now continue through the
          delivery process.
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
              ? navigate(`/shipment/${token}`)
              : navigate("/home")
          }
        >
          View Shipment
          <span>→</span>
        </button>

      </section>
    </main>
  );
}

export default PaymentResult;