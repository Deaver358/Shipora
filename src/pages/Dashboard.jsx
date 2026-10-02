import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../interceptors/api";
import { getCached, setCached } from "../utils/appCache";
import shiporaLogo from "../assets/shipora-logo.jpeg";
import "../index.css";

const WALLET_TTL = 30 * 1000;

function Dashboard() {
  const navigate = useNavigate();

  // ================= WALLET STATE =================

  const [balance, setBalance] = useState(0);
  const [heldForDelivery, setHeldForDelivery] = useState(0);
  const [transactions, setTransactions] = useState([]);

  const [walletLoading, setWalletLoading] = useState(true);
  const [walletError, setWalletError] = useState("");

  const currency = "₦";

  // ================= LOAD WALLET =================

  useEffect(() => {
    let mounted = true;

    const cachedBalance = getCached("wallet_balance");
    const cachedTransactions = getCached(
      "wallet_transactions"
    );

    const hasCachedBalance =
      cachedBalance &&
      typeof cachedBalance === "object";

    const hasCachedTransactions =
      Array.isArray(cachedTransactions);

    // --------------------------------------------------
    // SHOW CACHED DATA IMMEDIATELY
    // --------------------------------------------------

    if (hasCachedBalance) {
      setBalance(
        Number(cachedBalance?.available_balance || 0)
      );

      setHeldForDelivery(
        Number(cachedBalance?.held_for_delivery || 0)
      );
    }

    if (hasCachedTransactions) {
      setTransactions(cachedTransactions);
    }

    const hasCache =
      hasCachedBalance || hasCachedTransactions;

    if (hasCache) {
      setWalletLoading(false);
    }

    // --------------------------------------------------
    // FETCH FRESH DATA IN BACKGROUND
    // --------------------------------------------------

    const loadWallet = async () => {
      try {
        if (!hasCache) {
          setWalletLoading(true);
        }

        setWalletError("");

        // Balance and transactions are independent,
        // so request them at the same time.
        const [
          balanceResponse,
          transactionsResponse,
        ] = await Promise.all([
          api.get("wallet/balance"),
          api.get("wallet/transactions"),
        ]);

        if (!mounted) return;

        const balanceData =
          balanceResponse?.data || {};

        const transactionsData =
          transactionsResponse?.data;

        const transactionList =
          Array.isArray(transactionsData)
            ? transactionsData
            : transactionsData?.transactions || [];

        // ------------------------------------------------
        // UPDATE UI
        // ------------------------------------------------

        setBalance(
          Number(
            balanceData?.available_balance || 0
          )
        );

        setHeldForDelivery(
          Number(
            balanceData?.held_for_delivery || 0
          )
        );

        setTransactions(transactionList);

        // ------------------------------------------------
        // UPDATE CACHE
        // ------------------------------------------------

        setCached(
          "wallet_balance",
          balanceData,
          WALLET_TTL
        );

        setCached(
          "wallet_transactions",
          transactionList,
          WALLET_TTL
        );
      } catch (error) {
        if (!mounted) return;

        console.error(
          "Wallet loading error:",
          error
        );

        // If cached data exists, keep displaying it.
        // Only show a blocking error when there is
        // nothing cached to fall back to.
        if (!hasCache) {
          setWalletError(
            error?.response?.data?.detail ||
              error?.message ||
              "Unable to load wallet information."
          );

          setBalance(0);
          setHeldForDelivery(0);
          setTransactions([]);
        }
      } finally {
        if (mounted) {
          setWalletLoading(false);
        }
      }
    };

    loadWallet();

    return () => {
      mounted = false;
    };
  }, []);

  // ================= HELPERS =================

  const formatAmount = (amount) =>
    `${currency}${Number(amount || 0).toLocaleString(
      "en-NG",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;

  const formatDate = (date) => {
    if (!date) return "";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return String(date);
    }

    return parsedDate.toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getTransactionDetails = (transaction) => {
    const type = String(
      transaction?.type || ""
    ).toUpperCase();

    switch (type) {
      case "TOPUP":
        return {
          title: "Wallet Deposit",
          icon: "+",
          direction: "credit",
        };

      case "ESCROW_HOLD":
        return {
          title: "HELD FOR DELIVERY",
          icon: "−",
          direction: "debit",
        };

      case "ESCROW_RELEASE":
        return {
          title: "Delivery Payment",
          icon: "+",
          direction: "credit",
        };

      case "REFUND":
        return {
          title: "Shipment Refund",
          icon: "+",
          direction: "credit",
        };

      case "PLATFORM_COMMISSION":
        return {
          title: "Platform Commission",
          icon: "−",
          direction: "debit",
        };

      case "WITHDRAWAL":
        return {
          title: "Withdrawal",
          icon: "−",
          direction: "debit",
        };

      default:
        return {
          title: "Transaction",
          icon: "−",
          direction: "debit",
        };
    }
  };

  const formatStatus = (status) => {
    if (!status) return "Pending";

    const value = String(status).toLowerCase();

    if (value === "success") {
      return "Completed";
    }

    if (value === "pending") {
      return "Pending";
    }

    if (value === "failed") {
      return "Failed";
    }

    return String(status);
  };

  // ================= RENDER =================

  return (
    <div className="dashboard-page">

      {/* ================= TOP BAR ================= */}

      <header className="dashboard-topbar">

        <button
          type="button"
          className="dashboard-logo-button"
          onClick={() => navigate("/home")}
          aria-label="Go to Home"
        >
          <img
            src={shiporaLogo}
            alt="Shipora"
            className="dashboard-logo"
          />
        </button>

      </header>

      {/* ================= MAIN ================= */}

      <main className="dashboard-main">

        {/* ================= BALANCE ================= */}

        <section className="dashboard-balance-card">

          <div className="dashboard-balance-top">

            <span>
              AVAILABLE BALANCE
            </span>

            <span className="dashboard-balance-status">
              ACTIVE
            </span>

          </div>

          <strong className="dashboard-balance-amount">

            {walletLoading
              ? "Loading..."
              : formatAmount(balance)}

          </strong>

          <div className="dashboard-held">

            <div>

              <span>
                HELD FOR DELIVERY
              </span>

              <strong>

                {walletLoading
                  ? "Loading..."
                  : formatAmount(heldForDelivery)}

              </strong>

            </div>

            <p>
              Funds reserved for active deliveries.
            </p>

          </div>

        </section>

        {/* ================= WALLET ERROR ================= */}

        {walletError && (

          <div
            className="dashboard-wallet-error"
            role="alert"
          >
            {walletError}
          </div>

        )}

        {/* ================= ACTIONS ================= */}

        <section className="dashboard-actions">

          <button
            type="button"
            className="dashboard-action dashboard-deposit"
            onClick={() => navigate("/top-up")}
          >

            <span className="dashboard-action-icon">
              +
            </span>

            <div>

              <strong>
                Deposit
              </strong>

              <small>
                Add funds to your balance
              </small>

            </div>

            <span className="dashboard-action-arrow">
              →
            </span>

          </button>

          <button
            type="button"
            className="dashboard-action dashboard-withdraw"
            onClick={() => navigate("/withdraw")}
          >

            <span className="dashboard-action-icon">
              ↗
            </span>

            <div>

              <strong>
                Withdraw
              </strong>

              <small>
                Move available funds out
              </small>

            </div>

            <span className="dashboard-action-arrow">
              →
            </span>

          </button>

        </section>

        {/* ================= TRANSACTIONS ================= */}

        <section className="dashboard-transactions">

          <div className="dashboard-section-heading">

            <div>

              <span>
                ACCOUNT ACTIVITY
              </span>

              <h1>
                Transaction History
              </h1>

            </div>

          </div>

          {walletLoading ? (

            <div className="dashboard-empty">

              <div className="dashboard-empty-icon">
                —
              </div>

              <strong>
                Loading transactions...
              </strong>

            </div>

          ) : transactions.length === 0 ? (

            <div className="dashboard-empty">

              <div className="dashboard-empty-icon">
                —
              </div>

              <strong>
                No transactions yet
              </strong>

              <p>
                Your deposits, withdrawals and
                <strong> HELD FOR DELIVERY </strong>
                transactions will appear here.
              </p>

            </div>

          ) : (

            <div className="dashboard-transaction-list">

              {transactions.map((transaction) => {

                const details =
                  getTransactionDetails(
                    transaction
                  );

                const transactionId =
                  transaction?.transaction_id ||
                  transaction?.id ||
                  `${transaction?.type}-${transaction?.created_at}`;

                return (

                  <div
                    className="dashboard-transaction"
                    key={transactionId}
                  >

                    <div className="dashboard-transaction-icon">
                      {details.icon}
                    </div>

                    <div className="dashboard-transaction-info">

                      <strong>
                        {details.title}
                      </strong>

                      <span>
                        {formatDate(
                          transaction?.created_at
                        )}
                      </span>

                    </div>

                    <div className="dashboard-transaction-amount">

                      <strong
                        className={
                          details.direction === "credit"
                            ? "credit"
                            : "debit"
                        }
                      >

                        {details.direction === "credit"
                          ? "+"
                          : "−"}

                        {formatAmount(
                          transaction?.amount
                        )}

                      </strong>

                      <span>
                        {formatStatus(
                          transaction?.status
                        )}
                      </span>

                    </div>

                  </div>

                );
              })}

            </div>

          )}

        </section>

      </main>

      {/* ================= BOTTOM NAVIGATION ================= */}

      <nav className="bottom-nav">

        <button
          type="button"
          className="bottom-nav-item"
          onClick={() => navigate("/home")}
        >

          <svg viewBox="0 0 24 24" fill="none">

            <path
              d="M3 10.5L12 3L21 10.5V21H3V10.5Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />

            <path
              d="M9 21V14H15V21"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />

          </svg>

          <span>
            Home
          </span>

        </button>

        <button
          type="button"
          className="bottom-nav-item"
          onClick={() => navigate("/shipments")}
        >

          <svg viewBox="0 0 24 24" fill="none">

            <path
              d="M4 7.5L12 3L20 7.5V16.5L12 21L4 16.5V7.5Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />

            <path
              d="M4 7.5L12 12L20 7.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />

            <path
              d="M12 12V21"
              stroke="currentColor"
              strokeWidth="1.8"
            />

          </svg>

          <span>
            Shipments
          </span>

        </button>

        <button
          type="button"
          className="bottom-nav-item"
          onClick={() => navigate("/tracking")}
        >

          <svg viewBox="0 0 24 24" fill="none">

            <circle
              cx="12"
              cy="12"
              r="8.5"
              stroke="currentColor"
              strokeWidth="1.8"
            />

            <path
              d="M12 7V12L15.5 14"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

          </svg>

          <span>
            Tracking
          </span>

        </button>

        <button
          type="button"
          className="bottom-nav-item active"
          onClick={() => navigate("/dashboard")}
        >

          <svg viewBox="0 0 24 24" fill="none">

            <path
              d="M4 19V11"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />

            <path
              d="M10 19V5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />

            <path
              d="M16 19V9"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />

            <path
              d="M22 19V3"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />

          </svg>

          <span>
            Dashboard
          </span>

        </button>

      </nav>

    </div>
  );
}

export default Dashboard;