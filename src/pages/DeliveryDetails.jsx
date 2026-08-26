import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import "../index.css";

function DeliveryDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();

  const isJob = searchParams.get("mode") === "job";

  const delivery = {
    id: id || "DLV-2048-921",
    item: "Electronics",
    description:
      "Sealed electronics package requiring careful handling during transportation.",
    pickup: "Lekki Phase 1",
    destination: "Yaba",
    status: isJob ? "Available" : "Assigned",
    fee: 5000,
    vehicle: "Motorcycle",
    date: "Today",
    distance: "14 km",
    image: null,

    // These remain protected until backend assignment.
    senderName: "Protected until assignment",
    senderPhone: "Protected until assignment",
    recipientName: "Protected until assignment",
    recipientPhone: "Protected until assignment",
    exactPickup: "Available after assignment",
    exactDestination: "Available after assignment",
  };

  const statusClass = delivery.status
    .toLowerCase()
    .replace(/\s+/g, "-");

  return (
    <div className="delivery-details-page">

      <header className="delivery-details-header">

        <button
          className="delivery-details-back"
          onClick={() => navigate(-1)}
        >
          ←
        </button>

        <div>
          <span>DELIVERY DETAILS</span>
          <h1>{delivery.id}</h1>
        </div>

        <span
          className={`delivery-details-status ${statusClass}`}
        >
          <i></i>
          {delivery.status}
        </span>

      </header>

      <main className="delivery-details-content">

        <section className="delivery-details-hero">

          <div className="delivery-details-image">

            {delivery.image ? (
              <img
                src={delivery.image}
                alt={delivery.item}
              />
            ) : (
              <span>📦</span>
            )}

          </div>

          <div>

            <span className="delivery-details-eyebrow">
              SHIPMENT ITEM
            </span>

            <h2>{delivery.item}</h2>

            <p>{delivery.description}</p>

          </div>

        </section>

        <section className="delivery-details-route">

          <div className="delivery-details-section-heading">
            <span>01</span>

            <div>
              <span>DELIVERY ROUTE</span>
              <h2>Pickup to destination</h2>
            </div>
          </div>

          <div className="delivery-details-route-box">

            <div className="delivery-details-route-point">

              <span className="delivery-details-route-dot pickup"></span>

              <div>
                <small>PICKUP AREA</small>
                <strong>{delivery.pickup}</strong>
                <p>{delivery.exactPickup}</p>
              </div>

            </div>

            <div className="delivery-details-route-line"></div>

            <div className="delivery-details-route-point">

              <span className="delivery-details-route-dot destination"></span>

              <div>
                <small>DESTINATION AREA</small>
                <strong>{delivery.destination}</strong>
                <p>{delivery.exactDestination}</p>
              </div>

            </div>

          </div>

        </section>

        <section className="delivery-details-overview">

          <div className="delivery-details-section-heading">
            <span>02</span>

            <div>
              <span>DELIVERY OVERVIEW</span>
              <h2>Assignment information</h2>
            </div>
          </div>

          <div className="delivery-details-info-grid">

            <div>
              <span>DELIVERY FEE</span>
              <strong>
                ₦{delivery.fee.toLocaleString()}
              </strong>
            </div>

            <div>
              <span>VEHICLE</span>
              <strong>{delivery.vehicle}</strong>
            </div>

            <div>
              <span>DISTANCE</span>
              <strong>{delivery.distance}</strong>
            </div>

            <div>
              <span>DATE</span>
              <strong>{delivery.date}</strong>
            </div>

          </div>

        </section>

        <section className="delivery-details-contact">

          <div className="delivery-details-section-heading">
            <span>03</span>

            <div>
              <span>CONTACT INFORMATION</span>
              <h2>Protected details</h2>
            </div>
          </div>

          <div className="delivery-details-protected">

            <div>
              <span>📤</span>

              <div>
                <small>SENDER</small>
                <strong>{delivery.senderName}</strong>
                <p>{delivery.senderPhone}</p>
              </div>
            </div>

            <div>
              <span>📥</span>

              <div>
                <small>RECIPIENT</small>
                <strong>{delivery.recipientName}</strong>
                <p>{delivery.recipientPhone}</p>
              </div>
            </div>

          </div>

          <div className="delivery-details-notice">

            <span>🔒</span>

            <p>
              Contact details and exact addresses are protected
              until a dispatcher is assigned to the delivery.
            </p>

          </div>

        </section>

        {isJob ? (
          <section className="delivery-details-apply">

            <div>
              <span>DELIVERY OPPORTUNITY</span>

              <h2>
                Interested in this delivery?
              </h2>

              <p>
                Apply for this delivery to be considered for
                assignment. Protected shipment details become
                available after approval.
              </p>
            </div>

            <button
              onClick={() => {
                alert("Application submitted.");
              }}
            >
              Apply for Delivery
              <span>→</span>
            </button>

          </section>
        ) : (
          <section className="delivery-details-status-card">

            <span>DELIVERY STATUS</span>

            <h2>{delivery.status}</h2>

            <p>
              This delivery is part of your dispatch records.
              Further shipment information will be available
              according to your assignment status.
            </p>

          </section>
        )}

      </main>
      {/* ================= BOTTOM NAV ================= */}

      <nav className="bottom-nav">

        <button
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
          className="bottom-nav-item active"
          onClick={() => navigate("/Shipments")}
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

export default DeliveryDetails;