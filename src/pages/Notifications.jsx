import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import shiporaLogo from "../assets/shipora-logo.jpeg";
import "../styles/change.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1.0";

function NotificationIcon({ type }) {
  const normalizedType = String(type || "").toLowerCase();

  if (
    normalizedType.includes("shipment") ||
    normalizedType.includes("delivery")
  ) {
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

  if (
    normalizedType.includes("dispatch") ||
    normalizedType.includes("assignment") ||
    normalizedType.includes("application")
  ) {
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

  if (
    normalizedType.includes("payment") ||
    normalizedType.includes("wallet") ||
    normalizedType.includes("withdraw")
  ) {
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

  if (
    normalizedType.includes("rating") ||
    normalizedType.includes("review")
  ) {
    return (
      <svg viewBox="0 0 24 24" fill="none">
        <path
          d="M12 3.8L14.55 8.95L20.25 9.78L16.12 13.8L17.1 19.47L12 16.8L6.9 19.47L7.88 13.8L3.75 9.78L9.45 8.95L12 3.8Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
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
      <circle
        cx="12"
        cy="16"
        r="1"
        fill="currentColor"
      />
    </svg>
  );
}

function getNotificationClass(type) {
  const normalizedType = String(type || "").toLowerCase();

  if (
    normalizedType.includes("shipment") ||
    normalizedType.includes("delivery")
  ) {
    return "shipment";
  }

  if (
    normalizedType.includes("dispatch") ||
    normalizedType.includes("assignment") ||
    normalizedType.includes("application")
  ) {
    return "dispatch";
  }

  if (
    normalizedType.includes("payment") ||
    normalizedType.includes("wallet") ||
    normalizedType.includes("withdraw")
  ) {
    return "payment";
  }

  if (
    normalizedType.includes("rating") ||
    normalizedType.includes("review")
  ) {
    return "rating";
  }

  return "general";
}

function formatNotificationTime(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const now = new Date();
  const difference = now.getTime() - date.getTime();

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (difference >= 0 && difference < minute) {
    return "Just now";
  }

  if (difference >= 0 && difference < hour) {
    const minutes = Math.floor(difference / minute);
    return `${minutes}m ago`;
  }

  if (difference >= 0 && difference < day) {
    const hours = Math.floor(difference / hour);
    return `${hours}h ago`;
  }

  if (difference >= 0 && difference < 7 * day) {
    const days = Math.floor(difference / day);
    return `${days}d ago`;
  }

  return date.toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: date.getFullYear() !== now.getFullYear()
      ? "numeric"
      : undefined,
    hour: "numeric",
    minute: "2-digit",
  });
}

function Notifications() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState("");

  const loadNotifications = async () => {
    setLoading(true);
    setError("");

    try {
      const [notificationsResponse, countResponse] =
        await Promise.all([
          fetch(`${API_URL}/notifications/`, {
            credentials: "include",
          }),
          fetch(`${API_URL}/notifications/unread-count`, {
            credentials: "include",
          }),
        ]);

      const notificationsData =
        await notificationsResponse.json().catch(() => null);

      const countData =
        await countResponse.json().catch(() => null);

      if (!notificationsResponse.ok) {
        throw new Error(
          notificationsData?.detail ||
            "Unable to load your notifications."
        );
      }

      if (!countResponse.ok) {
        throw new Error(
          countData?.detail ||
            "Unable to load your unread notification count."
        );
      }

      setNotifications(
        Array.isArray(notificationsData)
          ? notificationsData
          : []
      );

      setUnreadCount(
        Number(countData?.unread_count || 0)
      );
    } catch (err) {
      setError(
        err.message ||
          "Something went wrong while loading notifications."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markAsRead = async (notification) => {
    if (notification.read || processingId) {
      return;
    }

    setProcessingId(notification.notification_id);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/notifications/${notification.notification_id}/read`,
        {
          method: "PATCH",
          credentials: "include",
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "Unable to mark notification as read."
        );
      }

      setNotifications((current) =>
        current.map((item) =>
          item.notification_id === notification.notification_id
            ? {
                ...item,
                read: true,
              }
            : item
        )
      );

      setUnreadCount((current) =>
        Math.max(0, current - 1)
      );
    } catch (err) {
      setError(
        err.message ||
          "Unable to update this notification."
      );
    } finally {
      setProcessingId(null);
    }
  };

  const markAllAsRead = async () => {
    if (!unreadCount || markingAll) {
      return;
    }

    setMarkingAll(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/notifications/read-all`,
        {
          method: "PATCH",
          credentials: "include",
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "Unable to mark all notifications as read."
        );
      }

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          read: true,
        }))
      );

      setUnreadCount(0);
    } catch (err) {
      setError(
        err.message ||
          "Unable to mark all notifications as read."
      );
    } finally {
      setMarkingAll(false);
    }
  };

  const deleteNotification = async (notificationId) => {
    if (processingId) {
      return;
    }

    setProcessingId(notificationId);
    setError("");

    const notification = notifications.find(
      (item) => item.notification_id === notificationId
    );

    try {
      const response = await fetch(
        `${API_URL}/notifications/${notificationId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "Unable to delete notification."
        );
      }

      setNotifications((current) =>
        current.filter(
          (item) =>
            item.notification_id !== notificationId
        )
      );

      if (notification && !notification.read) {
        setUnreadCount((current) =>
          Math.max(0, current - 1)
        );
      }
    } catch (err) {
      setError(
        err.message ||
          "Unable to delete this notification."
      );
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
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

          <img
            src={shiporaLogo}
            alt="Shipora"
            className="app-logo"
          />

          <div className="account-page-label">
            NOTIFICATIONS
          </div>
        </header>

        <main className="account-content notification-content">
          <section className="notification-loading">
            <div className="notification-loading-icon">
              ✓
            </div>

            <span className="account-eyebrow">
              SHIPORA UPDATES
            </span>

            <h1>Loading notifications</h1>

            <p>
              We're checking your latest account activity.
            </p>

            <div className="notification-loading-bar"></div>
          </section>
        </main>
      </div>
    );
  }

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

        <img
          src={shiporaLogo}
          alt="Shipora"
          className="app-logo"
        />

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
              Stay informed about your shipments and account
              activity.
            </p>
          </div>

          {unreadCount > 0 && (
            <div className="notification-count">
              <strong>{unreadCount}</strong>
              <span>Unread</span>
            </div>
          )}
        </section>

        {error && (
          <div
            className="notification-error"
            role="alert"
          >
            <span>!</span>
            <p>{error}</p>

            <button
              type="button"
              onClick={loadNotifications}
            >
              Try again
            </button>
          </div>
        )}

        {notifications.length > 0 && (
          <div className="notification-toolbar">
            <span>
              {notifications.length}{" "}
              {notifications.length === 1
                ? "notification"
                : "notifications"}
            </span>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                disabled={markingAll}
              >
                {markingAll
                  ? "Updating..."
                  : "Mark all as read"}
              </button>
            )}
          </div>
        )}

        {notifications.length > 0 ? (
          <section className="notification-list">
            {notifications.map((notification) => {
              const notificationClass =
                getNotificationClass(notification.type);

              const isProcessing =
                processingId ===
                notification.notification_id;

              return (
                <article
                  key={notification.notification_id}
                  className={`notification-card ${
                    notification.read ? "" : "unread"
                  }`}
                >
                  <button
                    type="button"
                    className={`notification-main ${
                      notification.read ? "" : "unread"
                    }`}
                    onClick={() =>
                      markAsRead(notification)
                    }
                    disabled={isProcessing}
                  >
                    <span
                      className={`notification-icon ${notificationClass}`}
                    >
                      <NotificationIcon
                        type={notification.type}
                      />
                    </span>

                    <span className="notification-body">
                      <span className="notification-title-row">
                        <strong>
                          {notification.title}
                        </strong>

                        {!notification.read && (
                          <span className="notification-unread-dot"></span>
                        )}
                      </span>

                      <span className="notification-message">
                        {notification.message}
                      </span>

                      <span className="notification-time">
                        {formatNotificationTime(
                          notification.created_at
                        )}
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    className="notification-delete"
                    onClick={() =>
                      deleteNotification(
                        notification.notification_id
                      )
                    }
                    disabled={isProcessing}
                    aria-label="Delete notification"
                    title="Delete notification"
                  >
                    ×
                  </button>
                </article>
              );
            })}
          </section>
        ) : (
          <div className="notification-empty">
            <div>✓</div>

            <h2>You're all caught up</h2>

            <p>
              New shipment and account updates will appear
              here.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default Notifications;