import { useState } from "react";
import { useNavigate } from "react-router-dom";
import shiporaLogo from "../assets/shipora-logo.jpeg";
import "../index.css";

function Help() {
  const navigate = useNavigate();

  const [selectedTopic, setSelectedTopic] = useState(null);

  const topics = [
    {
      icon: "📦",
      title: "Shipments",
      text: "Learn how to create, manage and review shipments.",
      details:
        "Vendors can create shipments by providing the pickup location, destination, package information, recipient details and delivery fee. Once a shipment is created, you can review its details, monitor its progress and manage the delivery process from Shipora.",
    },
    {
      icon: "🚚",
      title: "Dispatch",
      text: "Understand dispatch availability and delivery assignments.",
      details:
        "Verified dispatch users can view available delivery opportunities and review important shipment information before accepting a delivery. Once a dispatch is assigned, the shipment can move into the delivery process and its progress can be followed through Shipora.",
    },
    {
      icon: "📍",
      title: "Tracking",
      text: "Learn how shipment locations and delivery progress work.",
      details:
        "Use the shipment tracking number to view the current status and delivery progress of a shipment. Tracking can show the shipment journey from creation and processing through transit, out for delivery and final delivery.",
    },
    {
      icon: "💳",
      title: "Payments",
      text: "Understand delivery fees and payment protection.",
      details:
        "Delivery fees are displayed as part of the shipment payment arrangement. Shipora keeps the payment status visible throughout the delivery process so the relevant parties can understand whether the delivery payment is pending, held or completed.",
    },
    {
      icon: "⚠",
      title: "Disputes",
      text: "Find out what to do when there is an issue with a delivery.",
      details:
        "If there is an issue involving pickup, delivery, payment or the shipment itself, the shipment can be reported for review. Provide the relevant information so the issue can be properly assessed and handled through the Shipora support process.",
    },
    {
      icon: "👤",
      title: "Account",
      text: "Get help with your Shipora account and verification.",
      details:
        "Your Shipora account contains the information associated with your registration and role. If you need help with your account, verification or access, use the available account and support options to get assistance.",
    },
  ];

  return (
    <div className="account-page help-page">

      {/* ================= TOP BAR ================= */}

      <header className="account-topbar">

        <button
          className="account-back-button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
          type="button"
        >
          ←
        </button>

        <img
          src={shiporaLogo}
          alt="Shipora"
          className="app-logo"
        />

        <div className="account-page-label">
          HELP CENTER
        </div>

      </header>


      {/* ================= MAIN CONTENT ================= */}

      <main className="account-content help-content">

        {/* ================= HERO ================= */}

        <section className="help-hero">

          <span className="account-eyebrow">
            SHIPORA SUPPORT
          </span>

          <h1>
            How can we
            <span>help?</span>
          </h1>

          <p>
            Find guidance for shipments, dispatch, tracking,
            payments and your Shipora account.
          </p>

        </section>


        {/* ================= HELP TOPICS ================= */}

        <section className="help-topics">

          {topics.map((topic) => (

            <button
              className="help-topic-card"
              key={topic.title}
              type="button"
              onClick={() => setSelectedTopic(topic)}
            >

              <span className="help-topic-icon">
                {topic.icon}
              </span>

              <span>
                <strong>{topic.title}</strong>
                <small>{topic.text}</small>
              </span>

              <b>→</b>

            </button>

          ))}

        </section>


        {/* ================= CONTACT SUPPORT ================= */}

        <section className="help-contact-card">

          <div>

            <span className="account-eyebrow">
              STILL NEED HELP?
            </span>

            <h2>
              Talk to Shipora Support.
            </h2>

            <p>
              If you cannot find what you are looking for,
              our support team can help you with your shipment
              or account.
            </p>

          </div>

          <button
            type="button"
            onClick={() => navigate("/contact")}
          >
            Contact Support
            <span>→</span>
          </button>

        </section>

      </main>


      {/* ============================================================
          HELP TOPIC MODAL
          ============================================================ */}

      {selectedTopic && (

        <div
          className="help-modal-overlay"
          onClick={() => setSelectedTopic(null)}
        >

          <div
            className="help-modal"
            onClick={(event) => event.stopPropagation()}
          >

            {/* MODAL HEADER */}

            <div className="help-modal-header">

              <span className="help-modal-icon">
                {selectedTopic.icon}
              </span>

              <div>

                <span className="help-modal-eyebrow">
                  SHIPORA HELP CENTER
                </span>

                <h2>
                  {selectedTopic.title}
                </h2>

              </div>

            </div>


            {/* MODAL CONTENT */}

            <div className="help-modal-content">

              <p>
                {selectedTopic.details}
              </p>

            </div>


            {/* BACK BUTTON */}

            <button
              className="help-modal-back"
              type="button"
              onClick={() => setSelectedTopic(null)}
            >
              ← Back to Help Center
            </button>

          </div>

        </div>

      )}

    </div>
  );
}

export default Help;