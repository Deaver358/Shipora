import { useState } from "react";
import { useNavigate } from "react-router-dom";
import shiporaLogo from "../assets/shipora-logo.jpeg";
import "../index.css";

function NotificationIcon({ type }) {
  if (type === "shipment") {
    return (
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
    );
  }

  if (type === "dispatch") {
    return (
      <svg viewBox="0 0 24 24" fill="none">
        <circle
          cx="12"
          cy="12"
          r="8.5"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M7.5 12H16.5M12 7.5V16.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (type === "payment") {
    return (
      <svg viewBox="0 0 24 24" fill="none">
        <rect
          x="3.5"
          y="5.5"
          width="17"
          height="13"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M3.5 9.5H20.5"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M7 14H10"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none">
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M12 8V12"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="12" cy="16" r="1" fill="currentColor" />
    </svg>
  );
}

function Notifications() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "shipment",
      title: "Shipment created",
      message:
        "Your shipment SHP-2048-921 has been successfully created.",
      time: "Today, 2:50 PM",
      unread: true,
    },
    {
      id: 2,
      type: "dispatch",
      title: "Dispatch available",
      message:
        "A verified dispatch is available for your shipment route.",
      time: "Today, 1:20 PM",
      unread: true,
    },
    {
      id: 3,
      type: "payment",
      title: "Payment secured",
      message:
        "The delivery fee has been held securely for the shipment.",
      time: "Today, 10:42 AM",
      unread: false,
    },
    {
      id: 4,
      type: "shipment",
      title: "Shipment processing",
      message:
        "Your shipment information has been received and is being prepared.",
      time: "Yesterday, 4:15 PM",
      unread: false,
    },
  ]);

  const markAsRead = (id) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? { ...notification, unread: false }
          : notification
      )
    );
  };

  const unreadCount = notifications.filter(
    (notification) => notification.unread
  ).length;

  return (
    <div className="account-page notifications-page">

      <header className="account-topbar">

        <button
          className="account-back-button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          ←
        </button>

        <img src={shiporaLogo} alt="Shipora" className="app-logo" />

        <div className="account-page-label">
          NOTIFICATIONS
        </div>

      </header>


      <main className="account-content notification-content">

        <section className="notification-intro">

          <div>
            <span className="account-eyebrow">
              SHIPORA UPDATES
            </span>

            <h1>Notifications</h1>

            <p>
              Stay informed about your shipments and account activity.
            </p>
          </div>

          {unreadCount > 0 && (
            <div className="notification-count">
              <strong>{unreadCount}</strong>
              <span>Unread</span>
            </div>
          )}

        </section>


        <section className="notification-list">

          {notifications.map((notification) => (

            <button
              key={notification.id}
              className={`notification-card ${
                notification.unread ? "unread" : ""
              }`}
              onClick={() => markAsRead(notification.id)}
            >

              <span className={`notification-icon ${notification.type}`}>
                <NotificationIcon type={notification.type} />
              </span>


              <span className="notification-body">

                <span className="notification-title-row">

                  <strong>{notification.title}</strong>

                  {notification.unread && (
                    <span className="notification-unread-dot"></span>
                  )}

                </span>

                <span className="notification-message">
                  {notification.message}
                </span>

                <span className="notification-time">
                  {notification.time}
                </span>

              </span>

              <span className="notification-arrow">
                →
              </span>

            </button>

          ))}

        </section>


        {notifications.length === 0 && (
          <div className="notification-empty">
            <div>✓</div>
            <h2>You're all caught up</h2>
            <p>
              New shipment and account updates will appear here.
            </p>
          </div>
        )}

      </main>

    </div>
  );
}

export default Notifications;