import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../interceptors/api";
import "../index.css";

function DispatchAvailability() {
  const navigate = useNavigate();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [availabilities, setAvailabilities] = useState([]);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deactivatingId, setDeactivatingId] = useState(null);
  const [error, setError] = useState("");

  const [availability, setAvailability] = useState({
    operating_state: "",
    operating_city: "",
    service_area: "",
    vehicle_type: "",
    available_from: "",
    available_until: "",
    note: "",
  });

  const resetForm = () => {
    setAvailability({
      operating_state: "",
      operating_city: "",
      service_area: "",
      vehicle_type: "",
      available_from: "",
      available_until: "",
      note: "",
    });
  };

  const loadAvailabilities = async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await api.get("availability/mine");

      setAvailabilities(Array.isArray(data) ? data : []);
    } catch (requestError) {
      console.error("Availability loading error:", requestError);

      if (requestError.response?.status === 401) {
        setError(
          "Your session has expired. Please sign in again to manage your availability."
        );
      } else {
        setError(
          requestError.response?.data?.detail ||
            "We couldn't load your availability right now. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAvailabilities();
  }, []);

  const handleCreateAvailability = async (event) => {
    event.preventDefault();

    setCreating(true);
    setError("");

    try {
      const payload = {
        operating_state: availability.operating_state.trim(),
        operating_city: availability.operating_city.trim(),
        service_area: availability.service_area.trim(),
        vehicle_type: availability.vehicle_type,
        available_from: availability.available_from
          ? new Date(availability.available_from).toISOString()
          : null,
        available_until: availability.available_until
          ? new Date(availability.available_until).toISOString()
          : null,
        note: availability.note.trim() || null,
      };

      const { data } = await api.post("availability", payload);

      setAvailabilities((current) => [data, ...current]);

      setShowCreateModal(false);
      resetForm();
    } catch (requestError) {
      console.error("Create availability error:", requestError);

      setError(
        requestError.response?.data?.detail ||
          "We couldn't publish your availability. Please try again."
      );
    } finally {
      setCreating(false);
    }
  };

  const handleDeactivateAvailability = async (availabilityId) => {
    const confirmed = window.confirm(
      "Are you sure you want to deactivate this availability?"
    );

    if (!confirmed) {
      return;
    }

    setDeactivatingId(availabilityId);
    setError("");

    try {
      await api.patch(
        `availability/${availabilityId}/deactivate`
      );

      setAvailabilities((current) =>
        current.filter(
          (item) => item.availability_id !== availabilityId
        )
      );
    } catch (requestError) {
      console.error("Deactivate availability error:", requestError);

      setError(
        requestError.response?.data?.detail ||
          "We couldn't deactivate this availability. Please try again."
      );
    } finally {
      setDeactivatingId(null);
    }
  };

  const formatDateTime = (value) => {
    if (!value) {
      return "Not specified";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Not specified";
    }

    return date.toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="dispatch-availability-page">

      <button
        type="button"
        className="white-page-back-button"
        onClick={() => navigate(-1)}
        aria-label="Go back"
      >
        ←
      </button>

      <br />

      {/* HEADER */}

      <header className="dispatch-page-header">

        <div>

          <div className="eyebrow">
            <span className="eyebrow-dot"></span>
            CREATE AVAILABILITY
          </div>

          <h1>
            Set your schedule
            <span> Be available for deliveries.</span>
          </h1>

          <p>
            Create your availability for upcoming deliveries,
            set your service areas and vehicle details, and let
            vendors find dispatchers that match their delivery.
          </p>

        </div>

        <button
          type="button"
          className="dispatch-create-button"
          onClick={() => {
            setError("");
            setShowCreateModal(true);
          }}
        >
          <span>＋</span>
          Create Availability
        </button>

      </header>

      {/* INFO STRIP */}

      <section className="dispatch-info-strip">

        <div className="dispatch-info-item">
          <strong>Verified Dispatchers</strong>
          <span>
            Availability is published only for approved dispatchers.
          </span>
        </div>

        <div className="dispatch-info-item">
          <strong>Route Based</strong>
          <span>
            Set the areas where you are available to operate.
          </span>
        </div>

        <div className="dispatch-info-item">
          <strong>Flexible Schedule</strong>
          <span>
            Set when your availability starts and ends.
          </span>
        </div>

      </section>

      {/* ERROR */}

      {error && (
        <div className="dispatch-availability-error">
          <span className="dispatch-availability-error-icon">
            !
          </span>

          <div>
            <strong>Something went wrong</strong>
            <p>{error}</p>
          </div>

          <button
            type="button"
            onClick={loadAvailabilities}
            disabled={loading}
          >
            Try Again
          </button>
        </div>
      )}

      {/* CREATE MODAL */}

      {showCreateModal && (

        <div
          className="dispatch-modal-overlay"
          onClick={() => {
            if (!creating) {
              setShowCreateModal(false);
            }
          }}
        >

          <div
            className="dispatch-modal"
            onClick={(event) => event.stopPropagation()}
          >

            <div className="dispatch-modal-header">

              <div>
                <span>DISPATCH AVAILABILITY</span>

                <h2>
                  Create your availability
                </h2>
              </div>

              <button
                type="button"
                className="dispatch-modal-close"
                onClick={() => {
                  if (!creating) {
                    setShowCreateModal(false);
                  }
                }}
                disabled={creating}
              >
                ×
              </button>

            </div>

            <p className="dispatch-modal-intro">
              Tell vendors where you can operate and when you
              are available for delivery jobs.
            </p>

            <form onSubmit={handleCreateAvailability}>

              <div className="dispatch-form-grid">

                <label>
                  Operating State

                  <input
                    type="text"
                    placeholder="e.g. Lagos"
                    value={availability.operating_state}
                    onChange={(event) =>
                      setAvailability({
                        ...availability,
                        operating_state: event.target.value,
                      })
                    }
                    required
                  />
                </label>

                <label>
                  Operating City

                  <input
                    type="text"
                    placeholder="e.g. Lagos"
                    value={availability.operating_city}
                    onChange={(event) =>
                      setAvailability({
                        ...availability,
                        operating_city: event.target.value,
                      })
                    }
                    required
                  />
                </label>

                <label>
                  Service Area

                  <input
                    type="text"
                    placeholder="e.g. Lekki to Ikeja"
                    value={availability.service_area}
                    onChange={(event) =>
                      setAvailability({
                        ...availability,
                        service_area: event.target.value,
                      })
                    }
                    required
                  />
                </label>

                <label>
                  Vehicle Type

                  <select
                    value={availability.vehicle_type}
                    onChange={(event) =>
                      setAvailability({
                        ...availability,
                        vehicle_type: event.target.value,
                      })
                    }
                    required
                  >
                    <option value="">
                      Select vehicle
                    </option>

                    <option value="Motorcycle">
                      Motorcycle
                    </option>

                    <option value="Car">
                      Car
                    </option>

                    <option value="Van">
                      Van
                    </option>

                    <option value="Truck">
                      Truck
                    </option>

                    <option value="Bicycle">
                      Bicycle
                    </option>
                  </select>
                </label>

                <label>
                  Available From

                  <input
                    type="datetime-local"
                    value={availability.available_from}
                    onChange={(event) =>
                      setAvailability({
                        ...availability,
                        available_from: event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Available Until

                  <input
                    type="datetime-local"
                    value={availability.available_until}
                    onChange={(event) =>
                      setAvailability({
                        ...availability,
                        available_until: event.target.value,
                      })
                    }
                  />
                </label>

              </div>

              <label className="dispatch-full-field">

                Note

                <textarea
                  placeholder="Add any useful information about your availability..."
                  value={availability.note}
                  onChange={(event) =>
                    setAvailability({
                      ...availability,
                      note: event.target.value,
                    })
                  }
                />

              </label>

              <div className="dispatch-modal-actions">

                <button
                  type="button"
                  className="dispatch-cancel-button"
                  onClick={() => {
                    if (!creating) {
                      setShowCreateModal(false);
                    }
                  }}
                  disabled={creating}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="dispatch-submit-button"
                  disabled={creating}
                >
                  {creating
                    ? "Publishing..."
                    : "Publish Availability"}

                  {!creating && <span>→</span>}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* AVAILABILITIES */}

      <section className="created-availability-section">

        <div className="created-availability-heading">

          <div>
            <span className="created-availability-label">
              YOUR AVAILABILITIES
            </span>

            <h2>
              Published availabilities
            </h2>
          </div>

          {!loading && (
            <span className="created-availability-count">
              {availabilities.length}{" "}
              {availabilities.length === 1
                ? "Availability"
                : "Availabilities"}
            </span>
          )}

        </div>

        {loading ? (

          <div className="availability-loading-state">

            <div className="availability-loading-spinner"></div>

            <h3>
              Loading your availability
            </h3>

            <p>
              We're getting your published availability posts.
            </p>

          </div>

        ) : availabilities.length === 0 ? (

          <div className="availability-empty-state">

            <div className="availability-empty-icon">
              +
            </div>

            <h3>
              No availability published yet
            </h3>

            <p>
              Create your first availability post so vendors
              can find you for suitable delivery jobs.
            </p>

            <button
              type="button"
              onClick={() => {
                setError("");
                setShowCreateModal(true);
              }}
            >
              Create Availability
            </button>

          </div>

        ) : (

          <div className="created-availability-list">

            {availabilities.map((item) => (

              <article
                className="created-availability-card"
                key={item.availability_id}
              >

                <div className="created-availability-card-header">

                  <span className="availability-active-status">
                    <i></i>
                    Active
                  </span>

                  <button
                    type="button"
                    className="delete-availability-button"
                    onClick={() =>
                      handleDeactivateAvailability(
                        item.availability_id
                      )
                    }
                    disabled={
                      deactivatingId === item.availability_id
                    }
                  >
                    {deactivatingId === item.availability_id
                      ? "Deactivating..."
                      : "Deactivate Availability"}
                  </button>

                </div>

                <div className="created-availability-route">

                  <div>
                    <span>STATE</span>

                    <strong>
                      {item.operating_state}
                    </strong>
                  </div>

                  <div className="created-availability-arrow">
                    →
                  </div>

                  <div>
                    <span>CITY</span>

                    <strong>
                      {item.operating_city}
                    </strong>
                  </div>

                </div>

                <div className="created-availability-details">

                  <div>
                    <span>Service Area</span>

                    <strong>
                      {item.service_area}
                    </strong>
                  </div>

                  <div>
                    <span>Vehicle</span>

                    <strong>
                      {item.vehicle_type}
                    </strong>
                  </div>

                  <div>
                    <span>Available From</span>

                    <strong>
                      {formatDateTime(item.available_from)}
                    </strong>
                  </div>

                  <div>
                    <span>Available Until</span>

                    <strong>
                      {formatDateTime(item.available_until)}
                    </strong>
                  </div>

                </div>

                {item.note && (

                  <div className="created-availability-note">

                    <span>NOTE</span>

                    <p>
                      {item.note}
                    </p>

                  </div>

                )}

              </article>

            ))}

          </div>

        )}

      </section>

      {/* BOTTOM NAVIGATION */}

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

          <span>Home</span>
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

          <span>Shipments</span>
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

          <span>Tracking</span>
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

          <span>Dashboard</span>
        </button>

      </nav>

    </div>
  );
}

export default DispatchAvailability;