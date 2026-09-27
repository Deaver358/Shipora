import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../index.css";

function TopUp() {
  const navigate = useNavigate();

  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!amount || Number(amount) <= 0) return;

    setLoading(true);

    // Paystack top-up connection will be added here.

    setTimeout(() => {
      setLoading(false);
    }, 700);
  };

  return (
    <main className="wallet-action-page">

      <section className="wallet-action-card">

        <button
          className="back-button"
          onClick={() => navigate("/dashboard")}
        >
          ← Back to Dashboard
        </button>

        <span className="page-eyebrow">
          ACCOUNT FUNDING
        </span>

        <h1>Top up your balance</h1>

        <p>
          Add funds to your Shipora balance for future
          shipment and delivery payments.
        </p>

        <form onSubmit={handleSubmit}>

          <div className="form-field">
            <label>Amount</label>

            <div className="amount-input">
              <span>₦</span>

              <input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="quick-amounts">
            {[5000, 10000, 25000, 50000].map(
              (value) => (
                <button
                  type="button"
                  key={value}
                  onClick={() =>
                    setAmount(String(value))
                  }
                >
                  ₦{value.toLocaleString()}
                </button>
              )
            )}
          </div>

          <button
            type="submit"
            className="full-primary-button"
            disabled={loading}
          >
            {loading
              ? "Preparing payment..."
              : "Continue to Payment"}
            <span>→</span>
          </button>

        </form>

        <div className="secure-note">
          <span>✓</span>
          <p>Payments are securely processed.</p>
        </div>

      </section>
    </main>
  );
}

export default TopUp;