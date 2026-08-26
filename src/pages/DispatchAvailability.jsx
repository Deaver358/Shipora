import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../index.css";

function DispatchAvailability() {
  const navigate = useNavigate();

  const [showCreateModal, setShowCreateModal] = useState(false);

  const [createdAvailabilities, setCreatedAvailabilities] = useState([]);

  const [availability, setAvailability] = useState({
    pickup: "",
    destination: "",
    vehicle: "",
    distance: "",
    amount: "",
    date: "",
    note: "",
  });

  const handleCreateAvailability = (event) => {
    event.preventDefault();

    const newAvailability = {
      ...availability,
      id: Date.now(),
    };

    setCreatedAvailabilities((currentAvailabilities) => [
      newAvailability,
      ...currentAvailabilities,
    ]);

    setShowCreateModal(false);

    setAvailability({
      pickup: "",
      destination: "",
      vehicle: "",
      distance: "",
      amount: "",
      date: "",
      note: "",
    });
  };

  const handleDeleteAvailability = (id) => {
    setCreatedAvailabilities((currentAvailabilities) =>
      currentAvailabilities.filter(
        (availability) => availability.id !== id
      )
    );
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
</button> <br />

      {/* ================= HEADER ================= */}

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
            Create your availability for upcoming deliveries, set your
            service details and rates, and let vendors find and apply for
            deliveries that match your route.
          </p>

        </div>

        <button
          type="button"
          className="dispatch-create-button"
          onClick={() => setShowCreateModal(true)}
        >
          <span>＋</span>
          Create Availability
        </button>

      </header>


      {/* ================= INFO STRIP ================= */}

      <section className="dispatch-info-strip">

        <div className="dispatch-info-item">

          <strong>
            Verified Vendors
          </strong>

          <span>
            Connect with vendors who have completed verification.
          </span>

        </div>


        <div className="dispatch-info-item">

          <strong>
            Route Based
          </strong>

          <span>
            See vendors based on where they operate.
          </span>

        </div>


        <div className="dispatch-info-item">

          <strong>
            Clear Pricing
          </strong>

          <span>
            Set the service rate that suits you.
          </span>

        </div>

      </section>


      {/* ================= CREATE AVAILABILITY MODAL ================= */}

      {showCreateModal && (

        <div
          className="dispatch-modal-overlay"
          onClick={() => setShowCreateModal(false)}
        >

          <div
            className="dispatch-modal"
            onClick={(event) => event.stopPropagation()}
          >

            <div className="dispatch-modal-header">

              <div>

                <span>
                  DISPATCH AVAILABILITY
                </span>

                <h2>
                  Create your availability
                </h2>

              </div>


              <button
                type="button"
                className="dispatch-modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>

            </div>


            <p className="dispatch-modal-intro">
              Tell vendors where you can operate and the delivery
              amount you normally accept.
            </p>


            <form onSubmit={handleCreateAvailability}>

              <div className="dispatch-form-grid">

                <label>

                  Pickup Area

                  <input
                    type="text"
                    placeholder="e.g. Lekki"
                    value={availability.pickup}
                    onChange={(event) =>
                      setAvailability({
                        ...availability,
                        pickup: event.target.value,
                      })
                    }
                    required
                  />

                </label>


                <label>

                  Destination / Service Area

                  <input
                    type="text"
                    placeholder="e.g. Lagos Mainland"
                    value={availability.destination}
                    onChange={(event) =>
                      setAvailability({
                        ...availability,
                        destination: event.target.value,
                      })
                    }
                    required
                  />

                </label>


                <label>

                  Vehicle Type

                  <select
                    value={availability.vehicle}
                    onChange={(event) =>
                      setAvailability({
                        ...availability,
                        vehicle: event.target.value,
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

                  Service Distance

                  <input
                    type="text"
                    placeholder="e.g. Up to 25km"
                    value={availability.distance}
                    onChange={(event) =>
                      setAvailability({
                        ...availability,
                        distance: event.target.value,
                      })
                    }
                    required
                  />

                </label>


                <label>

                  Delivery Fee

                  <input
                    type="number"
                    placeholder="5000"
                    value={availability.amount}
                    onChange={(event) =>
                      setAvailability({
                        ...availability,
                        amount: event.target.value,
                      })
                    }
                    required
                  />

                </label>


                <label>

                  Available Date

                  <input
                    type="date"
                    value={availability.date}
                    onChange={(event) =>
                      setAvailability({
                        ...availability,
                        date: event.target.value,
                      })
                    }
                    required
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
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="dispatch-submit-button"
                >
                  Publish Availability
                  <span>→</span>
                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* ================= CREATED AVAILABILITIES ================= */}

      {createdAvailabilities.length > 0 && (

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


            <span className="created-availability-count">

              {createdAvailabilities.length}{" "}

              {createdAvailabilities.length === 1
                ? "Availability"
                : "Availabilities"}

            </span>

          </div>


          <div className="created-availability-list">

            {createdAvailabilities.map((createdAvailability) => (

              <article
                className="created-availability-card"
                key={createdAvailability.id}
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
                      handleDeleteAvailability(
                        createdAvailability.id
                      )
                    }
                  >
                    Delete Availability
                  </button>

                </div>


                <div className="created-availability-route">

                  <div>

                    <span>
                      FROM
                    </span>

                    <strong>
                      {createdAvailability.pickup}
                    </strong>

                  </div>


                  <div className="created-availability-arrow">
                    →
                  </div>


                  <div>

                    <span>
                      TO
                    </span>

                    <strong>
                      {createdAvailability.destination}
                    </strong>

                  </div>

                </div>


                <div className="created-availability-details">

                  <div>

                    <span>
                      Vehicle
                    </span>

                    <strong>
                      {createdAvailability.vehicle}
                    </strong>

                  </div>


                  <div>

                    <span>
                      Distance
                    </span>

                    <strong>
                      {createdAvailability.distance}
                    </strong>

                  </div>


                  <div>

                    <span>
                      Delivery Fee
                    </span>

                    <strong>
                      ₦
                      {Number(
                        createdAvailability.amount
                      ).toLocaleString()}
                    </strong>

                  </div>


                  <div>

                    <span>
                      Available Date
                    </span>

                    <strong>
                      {createdAvailability.date}
                    </strong>

                  </div>

                </div>


                {createdAvailability.note && (

                  <div className="created-availability-note">

                    <span>
                      NOTE
                    </span>

                    <p>
                      {createdAvailability.note}
                    </p>

                  </div>

                )}

              </article>

            ))}

          </div>

        </section>

      )}


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

export default DispatchAvailability;