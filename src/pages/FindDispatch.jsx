import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../interceptors/api";
import "../index.css";

function FindDispatch() {
  const navigate = useNavigate();

  const [filterOpen, setFilterOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");

  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [selectedDispatcher, setSelectedDispatcher] = useState(null);

  const [dispatchers, setDispatchers] = useState([]);
  const [shipments, setShipments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedShipment, setSelectedShipment] = useState("");
  const [proposedFee, setProposedFee] = useState("");

  useEffect(() => {
    loadDispatchers();
    loadShipments();
  }, []);

  const loadDispatchers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("availability");

      const records = Array.isArray(response.data)
        ? response.data
        : [];

      setDispatchers(records);
    } catch (err) {
      console.error("Failed to load dispatchers:", err);
      setError(
        err.response?.data?.detail ||
          "Unable to load available dispatchers."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadShipments = async () => {
    try {
      const response = await api.get("shipments/mine");

      const records = Array.isArray(response.data)
        ? response.data
        : [];

      setShipments(
        records.filter(
          (shipment) =>
            String(shipment.status || "").toUpperCase() === "OPEN"
        )
      );
    } catch (err) {
      console.error("Failed to load shipments:", err);
    }
  };

  const getDispatcherId = (dispatcher) => {
    return (
      dispatcher.dispatcher_id ||
      dispatcher.user_id ||
      dispatcher.owner_id ||
      dispatcher.dispatcher_user_id
    );
  };

  const getDispatcherName = (dispatcher) => {
    return (
      dispatcher.dispatcher_name ||
      dispatcher.name ||
      dispatcher.full_name ||
      "Dispatcher"
    );
  };

  const getRating = (dispatcher) => {
    const value =
      dispatcher.rating ??
      dispatcher.dispatcher_rating ??
      0;

    return Number(value) || 0;
  };

  const getVehicle = (dispatcher) => {
    return (
      dispatcher.vehicle_type ||
      dispatcher.vehicle ||
      "Not specified"
    );
  };

  const getCity = (dispatcher) => {
    return (
      dispatcher.operating_city ||
      dispatcher.city ||
      "Not specified"
    );
  };

  const getServiceArea = (dispatcher) => {
    return (
      dispatcher.service_area ||
      dispatcher.serviceArea ||
      "Not specified"
    );
  };

  const getAvailability = (dispatcher) => {
    if (dispatcher.available_from && dispatcher.available_until) {
      return `${formatDateTime(dispatcher.available_from)} - ${formatDateTime(
        dispatcher.available_until
      )}`;
    }

    if (dispatcher.available_from) {
      return formatDateTime(dispatcher.available_from);
    }

    return dispatcher.availability || "Available";
  };

  const formatDateTime = (value) => {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const renderStars = (rating) => {
    const rounded = Math.round(rating);

    return (
      <div className="rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={star <= rounded ? "star active" : "star"}
          >
            ★
          </span>
        ))}
        <span className="rating-number">
          {rating > 0 ? rating.toFixed(1) : "No rating"}
        </span>
      </div>
    );
  };

  const filteredDispatchers = useMemo(() => {
    if (activeFilter === "all") {
      return dispatchers;
    }

    return dispatchers.filter((dispatcher) => {
      const vehicle = getVehicle(dispatcher).toLowerCase();
      const availability = getAvailability(dispatcher).toLowerCase();

      if (activeFilter === "today") {
        return availability.includes("today");
      }

      if (activeFilter === "tomorrow") {
        return availability.includes("tomorrow");
      }

      if (["motorcycle", "bicycle", "car", "van", "truck"].includes(activeFilter)) {
        return vehicle.includes(activeFilter);
      }

      if (activeFilter === "rated") {
        return getRating(dispatcher) >= 4;
      }

      return true;
    });
  }, [dispatchers, activeFilter]);

  const openApplyModal = (dispatcher) => {
    setSelectedDispatcher(dispatcher);
    setSelectedShipment("");
    setProposedFee("");
    setApplyModalOpen(true);
  };

  const closeApplyModal = () => {
    setApplyModalOpen(false);
    setSelectedDispatcher(null);
    setSelectedShipment("");
    setProposedFee("");
  };

  const handleInvitation = async () => {
    if (!selectedDispatcher) return;

    if (!selectedShipment) {
      alert("Please select a shipment.");
      return;
    }

    const dispatcherId = getDispatcherId(selectedDispatcher);

    if (!dispatcherId) {
      alert("This dispatcher could not be identified.");
      return;
    }

    try {
      const payload = {};

      if (proposedFee) {
        const fee = Number(proposedFee);

        if (!Number.isFinite(fee) || fee <= 0) {
          alert("Please enter a valid proposed fee.");
          return;
        }

        payload.proposed_fee = fee;
      }

      await api.post(
        `shipments/${selectedShipment}/invite/${dispatcherId}`,
        payload
      );

      alert("Invitation sent successfully!");

      closeApplyModal();
    } catch (err) {
      console.error("Failed to send invitation:", err);

      alert(
        err.response?.data?.detail ||
          "Unable to send invitation."
      );
    }
  };

  return (
    <div className="find-dispatch-page">
      <button
        className="back-button"
        onClick={() => navigate(-1)}
      >
        ← Back
      </button>

      <div className="find-dispatch-header">
        <div>
          <span className="eyebrow">AVAILABLE NOW</span>
          <h1>Dispatchers near your route</h1>
          <p>
            Find available dispatchers based on their current
            availability and service area.
          </p>
        </div>

        <div className="filter-wrapper">
          <button
            className="filter-button"
            onClick={() => setFilterOpen(!filterOpen)}
          >
            Filter
            <span>⌄</span>
          </button>

          {filterOpen && (
            <div className="filter-menu">
              {[
                ["all", "All"],
                ["today", "Today"],
                ["tomorrow", "Tomorrow"],
                ["motorcycle", "Motorcycle"],
                ["bicycle", "Bicycle"],
                ["car", "Car"],
                ["van", "Van"],
                ["truck", "Truck"],
                ["rated", "Rated 4.0+"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  className={activeFilter === value ? "active" : ""}
                  onClick={() => {
                    setActiveFilter(value);
                    setFilterOpen(false);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="empty-state">
          <p>Loading available dispatchers...</p>
        </div>
      )}

      {!loading && error && (
        <div className="empty-state">
          <p>{error}</p>

          <button onClick={loadDispatchers}>
            Try Again
          </button>
        </div>
      )}

      {!loading &&
        !error &&
        filteredDispatchers.length === 0 && (
          <div className="empty-state">
            <p>No available dispatchers found.</p>
          </div>
        )}

      {!loading &&
        !error &&
        filteredDispatchers.length > 0 && (
          <div className="dispatchers-grid">
            {filteredDispatchers.map((dispatcher) => {
              const rating = getRating(dispatcher);

              return (
                <div
                  className="dispatcher-card"
                  key={
                    dispatcher.availability_id ||
                    dispatcher.id ||
                    getDispatcherId(dispatcher)
                  }
                >
                  <div className="dispatcher-card-top">
                    <div className="dispatcher-avatar">
                      {getDispatcherName(dispatcher)
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="dispatcher-info">
                      <div className="dispatcher-name-row">
                        <h3>{getDispatcherName(dispatcher)}</h3>

                        {dispatcher.verified && (
                          <span className="verified">
                            ✓ Verified
                          </span>
                        )}
                      </div>

                      {renderStars(rating)}
                    </div>
                  </div>

                  <div className="dispatcher-details">
                    <div>
                      <span>Operating city</span>
                      <strong>{getCity(dispatcher)}</strong>
                    </div>

                    <div>
                      <span>Service area</span>
                      <strong>{getServiceArea(dispatcher)}</strong>
                    </div>

                    <div>
                      <span>Vehicle</span>
                      <strong>{getVehicle(dispatcher)}</strong>
                    </div>

                    <div>
                      <span>Availability</span>
                      <strong>
                        {getAvailability(dispatcher)}
                      </strong>
                    </div>
                  </div>

                  {dispatcher.note && (
                    <div className="dispatcher-note">
                      <span>Note</span>
                      <p>{dispatcher.note}</p>
                    </div>
                  )}

                  <button
                    className="apply-button"
                    onClick={() =>
                      openApplyModal(dispatcher)
                    }
                  >
                    View & Apply
                  </button>
                </div>
              );
            })}
          </div>
        )}

      {applyModalOpen && selectedDispatcher && (
        <div
          className="modal-overlay"
          onClick={closeApplyModal}
        >
          <div
            className="apply-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              className="modal-close"
              onClick={closeApplyModal}
            >
              ×
            </button>

            <div className="modal-header">
              <div className="dispatcher-avatar">
                {getDispatcherName(selectedDispatcher)
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <h2>
                  {getDispatcherName(selectedDispatcher)}
                </h2>

                {renderStars(
                  getRating(selectedDispatcher)
                )}
              </div>
            </div>

            <div className="dispatcher-details">
              <div>
                <span>Operating city</span>
                <strong>
                  {getCity(selectedDispatcher)}
                </strong>
              </div>

              <div>
                <span>Service area</span>
                <strong>
                  {getServiceArea(selectedDispatcher)}
                </strong>
              </div>

              <div>
                <span>Vehicle</span>
                <strong>
                  {getVehicle(selectedDispatcher)}
                </strong>
              </div>

              <div>
                <span>Availability</span>
                <strong>
                  {getAvailability(selectedDispatcher)}
                </strong>
              </div>
            </div>

            {selectedDispatcher.note && (
              <div className="dispatcher-note">
                <span>Dispatcher note</span>
                <p>{selectedDispatcher.note}</p>
              </div>
            )}

            <div className="form-group">
              <label>
                Select shipment
              </label>

              <select
                value={selectedShipment}
                onChange={(event) =>
                  setSelectedShipment(event.target.value)
                }
              >
                <option value="">
                  Select an open shipment
                </option>

                {shipments.map((shipment) => (
                  <option
                    key={shipment.shipment_id}
                    value={shipment.shipment_id}
                  >
                    {shipment.tracking_number} —{" "}
                    {shipment.item_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>
                Proposed delivery fee (optional)
              </label>

              <input
                type="number"
                min="0"
                placeholder="Enter amount"
                value={proposedFee}
                onChange={(event) =>
                  setProposedFee(event.target.value)
                }
              />
            </div>

            <button
              className="apply-button"
              onClick={handleInvitation}
            >
              Send Invitation
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default FindDispatch;