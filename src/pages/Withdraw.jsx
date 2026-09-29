import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../index.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1.0";

function Withdraw() {
  const navigate = useNavigate();

  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState(0);
  const [bankAccount, setBankAccount] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadWithdrawalData();
  }, []);

  const loadWithdrawalData = async () => {
    setLoading(true);
    setError("");

    try {
      const [balanceResponse, profileResponse] = await Promise.all([
        fetch(`${API_URL}/wallet/balance`, {
          credentials: "include",
        }),
        fetch(`${API_URL}/profile/me`, {
          credentials: "include",
        }),
      ]);

      const balanceData = await balanceResponse.json().catch(() => null);
      const profileData = await profileResponse.json().catch(() => null);

      if (!balanceResponse.ok) {
        throw new Error(
          balanceData?.detail || "Unable to load your wallet balance."
        );
      }

      if (!profileResponse.ok) {
        throw new Error(
          profileData?.detail || "Unable to load your bank account."
        );
      }

      setBalance(
        Number(
          balanceData?.available_balance ??
            balanceData?.balance ??
            0
        )
      );

      const savedBank =
        profileData?.bank_account ||
        profileData?.bankAccount ||
        profileData?.bank ||
        null;

      setBankAccount(savedBank);
    } catch (err) {
      setError(
        err.message ||
          "Unable to load your withdrawal information."
      );
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (value) =>
    Number(value || 0).toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const getBankName = () => {
    if (!bankAccount) return "";

    return (
      bankAccount.bank_name ||
      bankAccount.bankName ||
      bankAccount.name ||
      bankAccount.bank ||
      "Registered bank"
    );
  };

  const getAccountNumber = () => {
    if (!bankAccount) return "";

    return (
      bankAccount.account_number ||
      bankAccount.accountNumber ||
      ""
    );
  };

  const getAccountName = () => {
    if (!bankAccount) return "";

    return (
      bankAccount.account_name ||
      bankAccount.accountName ||
      ""
    );
  };

  const maskAccountNumber = (number) => {
    if (!number) return "";

    const clean = String(number).replace(/\D/g, "");

    if (clean.length <= 4) {
      return clean;
    }

    return `••••${clean.slice(-4)}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const withdrawalAmount = Number(amount);

    if (!withdrawalAmount || withdrawalAmount <= 0) {
      setError("Enter a valid withdrawal amount.");
      return;
    }

    if (withdrawalAmount > balance) {
      setError(
        `You can only withdraw up to ₦${formatAmount(balance)}.`
      );
      return;
    }

    if (!bankAccount || !getAccountNumber()) {
      setError(
        "Please add a bank account before requesting a withdrawal."
      );
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/wallet/withdraw`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: withdrawalAmount,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            "Unable to process your withdrawal."
        );
      }

      setAmount("");
      setSuccess(
        `Your withdrawal of ₦${formatAmount(
          withdrawalAmount
        )} has been submitted successfully.`
      );

      await loadWithdrawalData();
    } catch (err) {
      setError(
        err.message ||
          "Something went wrong while processing your withdrawal."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="wallet-action-page">
        <section className="wallet-action-card wallet-loading-card">
          <div className="wallet-loading-icon">₦</div>

          <span className="page-eyebrow">
            ACCOUNT WITHDRAWAL
          </span>

          <h1>Loading your wallet</h1>

          <p>
            We're securely checking your balance and registered
            bank account.
          </p>

          <div className="wallet-loading-bar"></div>
        </section>
      </main>
    );
  }

  return (
    <main className="wallet-action-page">
      <section className="wallet-action-card">

        <button
          className="back-button"
          type="button"
          onClick={() => navigate("/dashboard")}
        >
          ← Back to Dashboard
        </button>

        <span className="page-eyebrow">
          ACCOUNT WITHDRAWAL
        </span>

        <h1>Withdraw funds</h1>

        <p>
          Transfer available funds from your Shipora balance
          to your registered bank account.
        </p>

        <div className="withdraw-balance">
          <div>
            <span>AVAILABLE BALANCE</span>

            <strong>
              ₦{formatAmount(balance)}
            </strong>
          </div>

          <div className="withdraw-balance-icon">
            ₦
          </div>
        </div>

        {bankAccount && getAccountNumber() ? (
          <div className="saved-bank-card">
            <div className="saved-bank-header">
              <div>
                <span>WITHDRAWAL ACCOUNT</span>
                <strong>{getBankName()}</strong>
              </div>

              <button
                type="button"
                onClick={() => navigate("/bank-account")}
              >
                Change Account
              </button>
            </div>

            <div className="saved-bank-details">
              <div>
                <span>ACCOUNT NAME</span>
                <strong>
                  {getAccountName() || "Account holder"}
                </strong>
              </div>

              <div>
                <span>ACCOUNT NUMBER</span>
                <strong>
                  {maskAccountNumber(getAccountNumber())}
                </strong>
              </div>
            </div>
          </div>
        ) : (
          <div className="no-bank-card">
            <div className="no-bank-icon">!</div>

            <div>
              <strong>Bank account required</strong>

              <p>
                Add a Nigerian bank account before requesting
                a withdrawal.
              </p>

              <button
                type="button"
                onClick={() => navigate("/bank-account")}
              >
                Add Bank Account →
              </button>
            </div>
          </div>
        )}

        {error && (
          <div
            className="wallet-action-error"
            role="alert"
          >
            <span>!</span>
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div
            className="wallet-action-success"
            role="status"
          >
            <span>✓</span>
            <p>{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="withdrawal-amount">
              Withdrawal Amount
            </label>

            <div className="amount-input">
              <span>₦</span>

              <input
                id="withdrawal-amount"
                type="number"
                min="1"
                max={balance}
                step="1"
                inputMode="numeric"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError("");
                  setSuccess("");
                }}
                placeholder="0"
                required
                disabled={
                  submitting ||
                  !bankAccount ||
                  !getAccountNumber()
                }
              />
            </div>

            <small className="withdrawal-limit">
              Maximum available: ₦{formatAmount(balance)}
            </small>
          </div>

          <button
            type="submit"
            className="full-primary-button"
            disabled={
              submitting ||
              !amount ||
              Number(amount) <= 0 ||
              Number(amount) > balance ||
              !bankAccount ||
              !getAccountNumber()
            }
          >
            {submitting
              ? "Processing withdrawal..."
              : "Request Withdrawal"}

            {!submitting && <span>→</span>}
          </button>
        </form>

        <div className="secure-note">
          <span>✓</span>

          <p>
            Withdrawals are securely processed to your registered
            bank account.
          </p>
        </div>

      </section>
    </main>
  );
}

export default Withdraw;