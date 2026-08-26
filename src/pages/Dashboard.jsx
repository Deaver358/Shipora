import { useState } from "react";
import { useNavigate } from "react-router-dom";
import shiporaLogo from "../assets/shipora-logo.jpeg";
import "../index.css";

function Dashboard() {
  const navigate = useNavigate();

  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);

  // Temporary display values.
  // Connect these to Supabase later.
  const balance = 0;
  const heldForDelivery = 0;
  const currency = "₦";

  const transactions = [];

  const formatAmount = (amount) =>
    `${currency}${Number(amount).toLocaleString()}`;

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
            {formatAmount(balance)}
          </strong>

          <div className="dashboard-held">

            <div>
              <span>HELD FOR DELIVERY</span>

              <strong>
                {formatAmount(heldForDelivery)}
              </strong>
            </div>

            <p>
              Funds reserved for active deliveries.
            </p>

          </div>

        </section>


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


          {transactions.length === 0 ? (

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

              {transactions.map((transaction) => (

                <div
                  className="dashboard-transaction"
                  key={transaction.id}
                >

                  <div className="dashboard-transaction-icon">
                    {transaction.type === "deposit"
                      ? "+"
                      : "−"}
                  </div>

                  <div className="dashboard-transaction-info">

                    <strong>
                      {transaction.type === "held"
                        ? "HELD FOR DELIVERY"
                        : transaction.title}
                    </strong>

                    <span>
                      {transaction.date}
                    </span>

                  </div>

                  <div className="dashboard-transaction-amount">

                    <strong
                      className={
                        transaction.type === "deposit"
                          ? "credit"
                          : "debit"
                      }
                    >
                      {transaction.type === "deposit"
                        ? "+"
                        : "−"}

                      {formatAmount(
                        transaction.amount
                      )}
                    </strong>

                    <span>
                      {transaction.status}
                    </span>

                  </div>

                </div>

              ))}

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