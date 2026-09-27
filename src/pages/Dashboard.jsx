import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import shiporaLogo from "../assets/shipora-logo.jpeg";
import "../index.css";

function Dashboard() {
  const navigate = useNavigate();

  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);

  // ================= WALLET STATE =================

  const [balance, setBalance] = useState(0);
  const [heldForDelivery, setHeldForDelivery] = useState(0);
  const [transactions, setTransactions] = useState([]);

  const [walletLoading, setWalletLoading] = useState(true);
  const [walletError, setWalletError] = useState("");

  const currency = "₦";

  // ================= BACKEND WALLET CONNECTION =================
  // Replace API_BASE_URL with your backend URL when connecting.

  const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:8000";

  useEffect(() => {
    const loadWallet = async () => {
      try {
        setWalletLoading(true);
        setWalletError("");

        /*
         * GET /wallet/balance
         *
         * Expected backend response example:
         *
         * {
         *   balance: 125000,
         *   held_for_delivery: 25000
         * }
         */

        const balanceResponse = await fetch(
          `${API_BASE_URL}/wallet/balance`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (!balanceResponse.ok) {
          throw new Error("Unable to load wallet balance.");
        }

        const balanceData = await balanceResponse.json();

        setBalance(Number(balanceData.balance || 0));
        setHeldForDelivery(
          Number(balanceData.held_for_delivery || 0)
        );


        /*
         * GET /wallet/transactions
         *
         * Expected backend response example:
         *
         * [
         *   {
         *     id: "123",
         *     type: "deposit",
         *     title: "Wallet Deposit",
         *     amount: 50000,
         *     date: "2026-09-26",
         *     status: "Completed"
         *   }
         * ]
         */

        const transactionsResponse = await fetch(
          `${API_BASE_URL}/wallet/transactions`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (!transactionsResponse.ok) {
          throw new Error("Unable to load transactions.");
        }

        const transactionsData =
          await transactionsResponse.json();

        setTransactions(
          Array.isArray(transactionsData)
            ? transactionsData
            : transactionsData.transactions || []
        );

      } catch (error) {
        console.error("Wallet loading error:", error);

        setWalletError(
          "Unable to load wallet information."
        );

        // Keep dashboard usable while backend is being connected.
        setBalance(0);
        setHeldForDelivery(0);
        setTransactions([]);

      } finally {
        setWalletLoading(false);
      }
    };

    loadWallet();
  }, [API_BASE_URL]);

  const formatAmount = (amount) =>
    `${currency}${Number(amount || 0).toLocaleString()}`;

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
            <span>AVAILABLE BALANCE</span>

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
              <span>HELD FOR DELIVERY</span>

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

          <div className="dashboard-wallet-error">
            {walletError}
          </div>

        )}


        {/* ================= ACTIONS ================= */}

        <section className="dashboard-actions">

          <button
            type="button"
            className="dashboard-action dashboard-deposit"
            onClick={() => setShowDeposit(true)}
          >
            <span className="dashboard-action-icon">
              +
            </span>

            <div>
              <strong>Deposit</strong>
              <small>Add funds to your balance</small>
            </div>

            <span className="dashboard-action-arrow">
              →
            </span>
          </button>


          <button
            type="button"
            className="dashboard-action"
            onClick={() => setShowWithdraw(true)}
          >
            <span className="dashboard-action-icon">
              ↗
            </span>

            <div>
              <strong>Withdraw</strong>
              <small>Move available funds out</small>
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
              <span>ACCOUNT ACTIVITY</span>
              <h1>Transaction History</h1>
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

                const transactionType =
                  String(transaction.type || "")
                    .toLowerCase();

                const isDeposit =
                  transactionType === "deposit" ||
                  transactionType === "credit" ||
                  transactionType === "topup" ||
                  transactionType === "top_up";

                const isHeld =
                  transactionType === "held" ||
                  transactionType === "held_for_delivery";

                return (

                  <div
                    className="dashboard-transaction"
                    key={transaction.id}
                  >

                    <div className="dashboard-transaction-icon">
                      {isDeposit ? "+" : "−"}
                    </div>

                    <div className="dashboard-transaction-info">

                      <strong>
                        {isHeld
                          ? "HELD FOR DELIVERY"
                          : transaction.title ||
                            transaction.description ||
                            "Transaction"}
                      </strong>

                      <span>
                        {transaction.date ||
                          transaction.created_at ||
                          ""}
                      </span>

                    </div>

                    <div className="dashboard-transaction-amount">

                      <strong
                        className={
                          isDeposit
                            ? "credit"
                            : "debit"
                        }
                      >
                        {isDeposit ? "+" : "−"}

                        {formatAmount(
                          transaction.amount
                        )}
                      </strong>

                      <span>
                        {transaction.status ||
                          "Completed"}
                      </span>

                    </div>

                  </div>

                );
              })}

            </div>

          )}

        </section>

      </main>


      {/* ================= DEPOSIT MODAL ================= */}

      {showDeposit && (

        <div
          className="dashboard-modal-overlay"
          onClick={() => setShowDeposit(false)}
        >

          <div
            className="dashboard-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              type="button"
              className="dashboard-modal-close"
              onClick={() => setShowDeposit(false)}
            >
              ×
            </button>

            <span>ACCOUNT FUNDING</span>

            <h2>
              Deposit funds
            </h2>

            <p>
              Add funds to your Shipora balance
              for future delivery payments.
            </p>

            <button
              type="button"
              className="dashboard-modal-primary"
              onClick={() => setShowDeposit(false)}
            >
              Continue
              <span>→</span>
            </button>

          </div>

        </div>

      )}


      {/* ================= WITHDRAW MODAL ================= */}

      {showWithdraw && (

        <div
          className="dashboard-modal-overlay"
          onClick={() => setShowWithdraw(false)}
        >

          <div
            className="dashboard-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              type="button"
              className="dashboard-modal-close"
              onClick={() => setShowWithdraw(false)}
            >
              ×
            </button>

            <span>ACCOUNT WITHDRAWAL</span>

            <h2>
              Withdraw funds
            </h2>

            <p>
              Withdraw funds from your available
              Shipora balance.
            </p>

            <button
              type="button"
              className="dashboard-modal-primary"
              onClick={() => setShowWithdraw(false)}
            >
              Continue
              <span>→</span>
            </button>

          </div>

        </div>

      )}


      {/* ================= BOTTOM NAVIGATION ================= */}

      <nav className="bottom-nav">

        <button
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

          <span>Home</span>
        </button>


        <button
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

          <span>Shipments</span>
        </button>


        <button
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

          <span>Tracking</span>
        </button>


        <button
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

          <span>Dashboard</span>
        </button>

      </nav>

    </div>
  );
}

export default Dashboard;