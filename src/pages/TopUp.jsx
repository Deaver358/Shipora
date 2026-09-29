import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../index.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1.0";

function TopUp() {
  const navigate = useNavigate();

  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const value = Number(amount);

    if (!value || value <= 0) {
      setError("Enter a valid amount.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/wallet/topup`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Math.round(value * 100),
          callback_url: `${window.location.origin}/payment-result`,
        }),
      });

      let data = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            data?.error ||
            "Unable to prepare your payment."
        );
      }

      const authorizationUrl =
        data?.authorization_url ||
        data?.data?.authorization_url ||
        data?.checkout_url;

      if (!authorizationUrl) {
        throw new Error(
          "Payment checkout could not be created. Please try again."
        );
      }

      window.location.href = authorizationUrl;
    } catch (err) {
      setError(
        err.message || "Something went wrong while preparing payment."
      );
      setLoading(false);
    }
  };

  return (
    <main className="wallet-action-page">
      <section className="wallet-action-card">
        <button
          className="back-button"
          type="button"
          onClick={() => navigate("/dashboard")}
        >
          ← Back to Dashboard
        </button> <br />

        <span className="page-eyebrow">ACCOUNT FUNDING</span>

        <h1>Fund your Shipora balance</h1>

        <p>
          Add funds securely to your Shipora wallet and use your
          available balance to pay for shipments.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="topup-amount">Amount</label>

            <div className="amount-input">
              <span>₦</span>

              <input
                id="topup-amount"
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError("");
                }}
                placeholder="0"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="quick-amounts">
            {[5000, 10000, 25000, 50000].map((value) => (
              <button
                type="button"
                key={value}
                onClick={() => {
                  setAmount(String(value));
                  setError("");
                }}
                disabled={loading}
              >
                ₦{value.toLocaleString()}
              </button>
            ))}
          </div>

          {error && (
            <div className="wallet-action-error" role="alert">
              <span>!</span>
              <p>{error}</p>
            </div>
          )}

          <button
            type="submit"
            className="full-primary-button"
            disabled={loading || !amount || Number(amount) <= 0}
          >
            {loading ? "Preparing secure payment..." : "Continue to Payment"}
            {!loading && <span>→</span>}
          </button>
        </form>

        <div className="secure-note">
          <span>✓</span>
          <p>
            Your payment is securely processed through Paystack.
          </p>
        </div>
      </section>
    </main>
  );
}

export default TopUp;