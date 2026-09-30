import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../index.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1.0";

function BankAccount() {
  const navigate = useNavigate();

  const [banks, setBanks] = useState([]);
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadBankData();
  }, []);

  const loadBankData = async () => {
    setLoading(true);
    setError("");

    try {
      const [banksResponse, profileResponse] = await Promise.all([
        fetch(`${API_URL}/profile/banks`, {
          credentials: "include",
        }),
        fetch(`${API_URL}/profile/me`, {
          credentials: "include",
        }),
      ]);

      const banksData = await banksResponse.json().catch(() => []);
      const profileData = await profileResponse.json().catch(() => null);

      if (!banksResponse.ok) {
        throw new Error("Unable to load Nigerian banks.");
      }

      if (!profileResponse.ok) {
        throw new Error(
          profileData?.detail || "Unable to load your profile."
        );
      }

      setBanks(Array.isArray(banksData) ? banksData : []);

      const saved =
        profileData?.bank_account ||
        profileData?.bankAccount ||
        profileData?.bank ||
        null;

      if (saved) {
        setBankCode(
          saved.bank_code ||
            saved.bankCode ||
            saved.code ||
            ""
        );

        setAccountNumber(
          saved.account_number ||
            saved.accountNumber ||
            ""
        );

        setAccountName(
          saved.account_name ||
            saved.accountName ||
            ""
        );
      }
    } catch (err) {
      setError(
        err.message || "Unable to load your bank account information."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!bankCode) {
      setError("Please select your bank.");
      return;
    }

    if (!/^\d{10}$/.test(accountNumber)) {
      setError("Enter a valid 10-digit account number.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`${API_URL}/profile/bank-account`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bank_code: bankCode,
          account_number: accountNumber,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            "Unable to save your bank account."
        );
      }

      setAccountName(
        data?.account_name ||
          data?.accountName ||
          accountName
      );

      setSuccess("Your bank account has been saved successfully.");

      setTimeout(() => {
        navigate("/withdraw");
      }, 1000);
    } catch (err) {
      setError(
        err.message || "Something went wrong while saving your account."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="bank-account-page">
        <section className="bank-account-card bank-account-loading">
          <div className="bank-account-icon">₦</div>

          <span className="page-eyebrow">
            BANK ACCOUNT
          </span>

          <h1>Loading account details</h1>

          <p>
            We're securely checking your registered bank account.
          </p>

          <div className="bank-loading-bar" />
        </section>
      </main>
    );
  }

  return (
    <main className="bank-account-page">
      <section className="bank-account-card">

        <button
          type="button"
          className="back-button"
          onClick={() => navigate("/withdraw")}
        >
          ← Back to Withdrawal
        </button> <br />

        <span className="page-eyebrow">
          BANK ACCOUNT
        </span>

        <h1>
          {accountNumber
            ? "Update your bank account"
            : "Add your bank account"}
        </h1>

        <p>
          Your registered Nigerian bank account is used for
          Shipora withdrawals.
        </p>

        <div className="bank-security-note">
          <span>✓</span>

          <div>
            <strong>Secure bank details</strong>
            <p>
              Your bank information is securely stored and used
              only for withdrawals.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>

          <div className="form-field">
            <label htmlFor="bank">
              Bank
            </label>

            <select
              id="bank"
              value={bankCode}
              onChange={(e) => {
                setBankCode(e.target.value);
                setError("");
                setSuccess("");
              }}
              disabled={saving}
              required
            >
              <option value="">
                Select your bank
              </option>

              {banks.map((bank) => (
                <option
                  key={bank.code}
                  value={bank.code}
                >
                  {bank.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="account-number">
              Account Number
            </label>

            <input
              id="account-number"
              type="text"
              inputMode="numeric"
              maxLength="10"
              value={accountNumber}
              onChange={(e) => {
                const value = e.target.value
                  .replace(/\D/g, "")
                  .slice(0, 10);

                setAccountNumber(value);
                setError("");
                setSuccess("");
              }}
              placeholder="Enter 10-digit account number"
              disabled={saving}
              required
            />

            <small className="bank-field-hint">
              Enter the account number linked to your bank.
            </small>
          </div>

          {accountName && (
            <div className="verified-account-name">
              <span>✓</span>

              <div>
                <small>ACCOUNT NAME</small>
                <strong>{accountName}</strong>
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

          <button
            type="submit"
            className="full-primary-button"
            disabled={
              saving ||
              !bankCode ||
              accountNumber.length !== 10
            }
          >
            {saving
              ? "Saving account..."
              : accountNumber
                ? "Update Bank Account"
                : "Save Bank Account"}

            {!saving && <span>→</span>}
          </button>

        </form>

        <div className="secure-note">
          <span>✓</span>

          <p>
            You can change your registered bank account whenever
            necessary.
          </p>
        </div>

      </section>
    </main>
  );
}

export default BankAccount;