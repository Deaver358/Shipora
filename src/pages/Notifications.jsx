import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../interceptors/api";
import {
  getCached,
  setCached,
} from "../utils/appCache";
import shiporaLogo from "../assets/shipora-logo.jpeg";
import "../styles/change.css";

const NOTIFICATIONS_TTL = 30 * 1000;

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
    year:
      date.getFullYear() !== now.getFullYear()
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

  // ================= CACHE HELPERS =================

  const saveNotificationCache = (
    notificationList,
    count
  ) => {
    setCached(
      "notifications_list",
      notificationList,
      NOTIFICATIONS_TTL
    );

    setCached(
      "notifications_unread_count",
      count,
      NOTIFICATIONS_TTL
    );
  };

  // ================= LOAD NOTIFICATIONS =================

  const loadNotifications = async ({
    force = false,
  } = {}) => {
    try {
      setError("");

      // ------------------------------------------------
      // CACHE-FIRST
      // ------------------------------------------------

      if (!force) {
        const cachedNotifications = getCached(
          "notifications_list"
        );

        const cachedUnreadCount = getCached(
          "notifications_unread_count"
        );

        const hasNotificationCache =
          Array.isArray(cachedNotifications);

        const hasCountCache =
          cachedUnreadCount !== null;

        if (hasNotificationCache) {
          setNotifications(cachedNotifications);
        }

        if (hasCountCache) {
          setUnreadCount(
            Number(cachedUnreadCount || 0)
          );
        }

        if (
          hasNotificationCache ||
          hasCountCache
        ) {
          setLoading(false);

          // Refresh silently in the background.
          loadNotifications({ force: true });
          return;
        }
      }

      // ------------------------------------------------
      // FRESH REQUESTS
      // ------------------------------------------------

      if (!getCached("notifications_list")) {
        setLoading(true);
      }

      const [
        notificationsResponse,
        countResponse,
      ] = await Promise.all([
        api.get("notifications/"),
        api.get("notifications/unread-count"),
      ]);

      const notificationsData =
        notificationsResponse?.data;

      const countData =
        countResponse?.data;

      const notificationList =
        Array.isArray(notificationsData)
          ? notificationsData
          : [];

      const count = Number(
        countData?.unread_count || 0
      );

      setNotifications(notificationList);
      setUnreadCount(count);

      saveNotificationCache(
        notificationList,
        count
      );
    } catch (err) {
      console.error(
        "Notification loading error:",
        err
      );

      const message =
        err?.response?.data?.detail ||
        err?.message ||
        "Something went wrong while loading notifications.";

      // If cached data is already visible, don't
      // replace it with a blocking error.
      const cachedNotifications =
        getCached("notifications_list");

      if (Array.isArray(cachedNotifications)) {
        setNotifications(cachedNotifications);

        const cachedCount = getCached(
          "notifications_unread_count"
        );

        if (cachedCount !== null) {
          setUnreadCount(
            Number(cachedCount || 0)
          );
        }
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  // ================= MARK ONE AS READ =================

  const markAsRead = async (notification) => {
    if (notification.read || processingId) {
      return;
    }

    setProcessingId(
      notification.notification_id
    );
    setError("");

    try {
      await api.patch(
        `notifications/${notification.notification_id}/read`
      );

      const updatedNotifications =
        notifications.map((item) =>
          item.notification_id ===
          notification.notification_id
            ? {
                ...item,
                read: true,
              }
            : item
        );

      const updatedUnreadCount =
        Math.max(0, unreadCount - 1);

      setNotifications(updatedNotifications);
      setUnreadCount(updatedUnreadCount);

      saveNotificationCache(
        updatedNotifications,
        updatedUnreadCount
      );
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Unable to update this notification."
      );
    } finally {
      setProcessingId(null);
    }
  };

  // ================= MARK ALL AS READ =================

  const markAllAsRead = async () => {
    if (!unreadCount || markingAll) {
      return;
    }

    setMarkingAll(true);
    setError("");

    try {
      await api.patch(
        "notifications/read-all"
      );

      const updatedNotifications =
        notifications.map(
          (notification) => ({
            ...notification,
            read: true,
          })
        );

      setNotifications(updatedNotifications);
      setUnreadCount(0);

      saveNotificationCache(
        updatedNotifications,
        0
      );
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Unable to mark all notifications as read."
      );
    } finally {
      setMarkingAll(false);
    }
  };

  // ================= DELETE =================

  const deleteNotification = async (
    notificationId
  ) => {
    if (processingId) {
      return;
    }

    setProcessingId(notificationId);
    setError("");

    const notification = notifications.find(
      (item) =>
        item.notification_id === notificationId
    );

    try {
      await api.delete(
        `notifications/${notificationId}`
      );

      const updatedNotifications =
        notifications.filter(
          (item) =>
            item.notification_id !==
            notificationId
        );

      const updatedUnreadCount =
        notification && !notification.read
          ? Math.max(0, unreadCount - 1)
          : unreadCount;

      setNotifications(updatedNotifications);
      setUnreadCount(updatedUnreadCount);

      saveNotificationCache(
        updatedNotifications,
        updatedUnreadCount
      );
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Unable to delete this notification."
      );
    } finally {
      setProcessingId(null);
    }
  };

  // ================= LOADING =================

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

  // ================= RENDER =================

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
              onClick={() =>
                loadNotifications({
                  force: true,
                })
              }
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
                getNotificationClass(
                  notification.type
                );

              const isProcessing =
                processingId ===
                notification.notification_id;

              return (
                <article
                  key={notification.notification_id}
                  className={`notification-card ${
                    notification.read
                      ? ""
                      : "unread"
                  }`}
                >
                  <button
                    type="button"
                    className={`notification-main ${
                      notification.read
                        ? ""
                        : "unread"
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
