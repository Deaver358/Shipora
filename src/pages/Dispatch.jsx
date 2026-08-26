import { useNavigate } from "react-router-dom";
import "../index.css";

function Dispatch() {
  const navigate = useNavigate();

  const dispatchOptions = [
    {
      number: "01",
      icon: "◷",
      title: "Set Availability",
      text: "Let Shipora know when you are available to accept delivery assignments.",
      button: "Set Availability",
      path: "/dispatch-availability",
    },
    {
      number: "02",
      icon: "⌁",
      title: "Delivery Opportunities",
      text: "Explore available delivery jobs and find assignments that match your availability.",
      button: "Find Opportunities",
      path: "/dispatch-jobs",
    },
    {
      number: "03",
      icon: "✓",
      title: "My Deliveries",
      text: "View your active assignments, completed deliveries and your delivery history.",
      button: "View Deliveries",
      path: "/my-deliveries",
    },
  ];

  return (
    <div className="dispatch-page">

      <header className="dispatch-header">

        <button
          className="dispatch-back-button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          ←
        </button>


        <span className="dispatch-header-label">
          DISPATCH
        </span>

      </header>


      <main className="dispatch-content">

        <section className="dispatch-hero">

          <span className="dispatch-eyebrow">
            DISPATCH MANAGEMENT
          </span>

          <h1>
            Move deliveries.
            <span>Stay in control.</span>
          </h1>

          <p>
            Manage your availability, discover delivery opportunities
            and keep track of every assignment from one place.
          </p>

        </section>


        <section className="dispatch-options">

          {dispatchOptions.map((option) => (

            <article
              className="dispatch-option-card"
              key={option.title}
            >

              <div className="dispatch-option-top">

                <span className="dispatch-option-number">
                  {option.number}
                </span>

                <span className="dispatch-option-icon">
                  {option.icon}
                </span>

              </div>


              <div className="dispatch-option-content">

                <h2>
                  {option.title}
                </h2>

                <p>
                  {option.text}
                </p>

              </div>


              <button
                className="dispatch-option-button"
                onClick={() => navigate(option.path)}
              >
                {option.button}
                <span>→</span>
              </button>

            </article>

          ))}

        </section>


        <section className="dispatch-note">

          <div className="dispatch-note-mark">
            +
          </div>

          <div>
            <span>DISPATCH NETWORK</span>

            <strong>
              Ready for your next delivery?
            </strong>

            <p>
              Keep your availability updated so you can discover
              relevant delivery opportunities when you are ready to work.
            </p>
          </div>

        </section>

      </main>

            {/* ================= BOTTOM NAVIGATION ================= */}

      <nav className="bottom-nav">

        <button
          type="button"
          className="bottom-nav-item"
          onClick={() => navigate("/Home")}
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
          className="bottom-nav-item active"
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
          className="bottom-nav-item"
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

export default Dispatch;