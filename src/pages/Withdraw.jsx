import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../index.css";

function Withdraw() {
  const navigate = useNavigate();

  const [amount, setAmount] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bank, setBank] = useState("");
  const [loading, setLoading] = useState(false);

  const balance = 0;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!amount || Number(amount) <= 0) return;

    setLoading(true);

    // Backend withdrawal connection will be added here.

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
          ACCOUNT WITHDRAWAL
        </span>

        <h1>Withdraw funds</h1>

        <p>
          Withdraw available funds to your registered
          bank account.
        </p>

        <div className="withdraw-balance">
          <span>AVAILABLE BALANCE</span>
          <strong>
            ₦{Number(balance).toLocaleString()}
          </strong>
        </div>

        <form onSubmit={handleSubmit}>

          <div className="form-field">
            <label>Withdrawal Amount</label>

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

          <div className="form-field">
            <label>Bank</label>

            <select
              value={bank}
              onChange={(e) => setBank(e.target.value)}
              required
            >
              <option value="">Select bank</option>
              <option value="access">Access Bank</option>
              <option value="gtb">GTBank</option>
              <option value="firstbank">First Bank</option>
              <option value="uba">UBA</option>
              <option value="zenith">Zenith Bank</option>
              <option value="opay">OPay</option>
              <option value="kuda">Kuda</option>
            </select>
          </div>

          <div className="form-field">
            <label>Account Number</label>

            <input
              type="text"
              inputMode="numeric"
              maxLength="10"
              value={accountNumber}
              onChange={(e) =>
                setAccountNumber(e.target.value)
              }
              placeholder="10-digit account number"
              required
            />
          </div>

          <div className="form-field">
            <label>Account Name</label>

            <input
              type="text"
              value={accountName}
              onChange={(e) =>
                setAccountName(e.target.value)
              }
              placeholder="Account holder name"
              required
            />
          </div>

          <button
            type="submit"
            className="full-primary-button"
            disabled={loading}
          >
            {loading
              ? "Processing..."
              : "Request Withdrawal"}
            <span>→</span>
          </button>

        </form>

        <div className="secure-note">
          <span>✓</span>
          <p>
            Withdrawals are sent to your registered bank
            account.
          </p>
        </div>

      </section>
    </main>
  );
}

export default Withdraw;