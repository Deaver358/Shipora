import { useNavigate, useParams } from "react-router-dom";
import "../index.css";

function ShipmentDetails() {
  const navigate = useNavigate();
  const { shipmentId } = useParams();

  // Frontend placeholder.
  // Supabase shipment data will replace this later.
  const shipment = {
    id: shipmentId || "SHP-2048-921",
    status: "available",
    paymentStatus: "HELD FOR DELIVERY",
    itemName: "Electronics",
    description: "Laptop in sealed package",
    media: [
  // Backend will eventually populate this.
  // Example:
  // {
  //   type: "image",
  //   url: "https://..."
  // },
  // {
  //   type: "video",
  //   url: "https://..."
  // }
],
    pickup: "Lekki Phase 1, Lagos",
    destination: "Yaba, Lagos",
    recipientName: "David Emmanuel",
    recipientPhone: "080XXXXXXXX",
    deliveryFee: 5000,
    paymentBy: "Vendor",
    createdAt: "Today, 10:42 AM",
  };

  const dispatches = [
    {
      id: 1,
      name: "Michael A.",
      rating: "4.9",
      trips: 127,
      vehicle: "Car",
      route: "Lekki → Mainland",
      price: "₦5,000",
    },
    {
      id: 2,
      name: "Daniel O.",
      rating: "4.8",
      trips: 94,
      vehicle: "Van",
      route: "Lekki → Mainland",
      price: "₦5,500",
    },
  ];

  return (
    <div className="shipment-details-page">
      <button
  type="button"
  className="white-page-back-button"
  onClick={() => navigate(-1)}
  aria-label="Go back"
>
  ←
</button> <br /><br />

      {/* ================= HEADER ================= */}

      <header className="shipment-details-header">

        <div>
          <span>SHIPMENT DETAILS</span>

          <h1>{shipment.id}</h1>
        </div>

        <div className="shipment-header-status">
          <i></i>
          Available
        </div>

      </header>


      {/* ================= MAIN ================= */}

      <main className="shipment-details-content">

        {/* ================= STATUS ================= */}

        <section className="shipment-status-card">

          <div className="shipment-status-icon">
            ✓
          </div>

          <div>
            <span>PAYMENT STATUS</span>

            <h2>{shipment.paymentStatus}</h2>

            <p>
              The delivery amount is protected and will be
              released according to the shipment completion
              and dispute process.
            </p>
          </div>

        </section>


        {/* ================= ROUTE ================= */}

        <section className="shipment-detail-card">

          <div className="detail-card-heading">
            <div>
              <span>SHIPMENT ROUTE</span>
              <h2>Pickup & delivery</h2>
            </div>
          </div>


          <div className="shipment-detail-route">

            <div className="detail-route-item">

              <span className="route-dot pickup"></span>

              <div>
                <small>PICKUP</small>
                <strong>{shipment.pickup}</strong>
              </div>

            </div>


            <div className="detail-route-line"></div>


            <div className="detail-route-item">

              <span className="route-dot destination"></span>

              <div>
                <small>DESTINATION</small>
                <strong>{shipment.destination}</strong>
              </div>

            </div>

          </div>

        </section>


        {/* ================= ITEM ================= */}

        <section className="shipment-detail-card">

          <div className="detail-card-heading">
            <div>
              <span>PACKAGE</span>
              <h2>Shipment information</h2>
            </div>
          </div>


          <div className="shipment-info-grid">

            <div>
              <small>ITEM</small>
              <strong>{shipment.itemName}</strong>
            </div>

            <div>
              <small>DESCRIPTION</small>
              <strong>{shipment.description}</strong>
            </div>

            <div>
              <small>RECIPIENT</small>
              <strong>{shipment.recipientName}</strong>
            </div>

            <div>
              <small>RECIPIENT PHONE</small>
              <strong>{shipment.recipientPhone}</strong>
            </div>

          </div>

        </section> 

        {/* ================= PACKAGE MEDIA ================= */}

<section className="shipment-detail-card shipment-media-card">

  <div className="detail-card-heading">

    <div>
      <span>PACKAGE MEDIA</span>

      <h2>Item photos & videos</h2>

      <p>
        Photos and videos provided for identification and
        delivery handling.
      </p>
    </div>

  </div>


  {shipment.media && shipment.media.length > 0 ? (

    <div className="shipment-media-grid">

      {shipment.media.map((media, index) => (

        <div
          className="shipment-media-item"
          key={index}
        >

          {media.type === "video" ? (

            <video
              src={media.url}
              controls
              preload="metadata"
            />

          ) : (

            <img
              src={media.url}
              alt={`Shipment item ${index + 1}`}
            />

          )}

        </div>

      ))}

    </div>

  ) : (

    <div className="shipment-media-empty">

      <div className="shipment-media-empty-icon">
        📦
      </div>

      <strong>No package media uploaded</strong>

      <p>
        Photos or videos of the item will appear here
        once they are uploaded.
      </p>

    </div>

  )}

</section>


        {/* ================= PAYMENT ================= */}

        <section className="shipment-detail-card">

          <div className="detail-card-heading">
            <div>
              <span>DELIVERY PAYMENT</span>
              <h2>Payment arrangement</h2>
            </div>
          </div>


          <div className="shipment-payment-summary">

            <div>
              <small>DELIVERY FEE</small>

              <strong>
                ₦{shipment.deliveryFee.toLocaleString()}
              </strong>
            </div>

            <div>
              <small>PAID BY</small>

              <strong>
                {shipment.paymentBy}
              </strong>
            </div>

            <div>
              <small>STATUS</small>

              <strong className="held-status">
                HELD FOR DELIVERY
              </strong>
            </div>

          </div>

        </section>

        <div className="shipment-dispatch-empty">
  <div className="shipment-dispatch-empty-icon">
    🚚
  </div>

  <div className="shipment-dispatch-empty-content">
    <span className="shipment-dispatch-eyebrow">
      DISPATCH STATUS
    </span>

    <h3>No dispatch assigned yet</h3>

    <p>
      Your shipment is currently waiting for a dispatcher.
      Once a dispatcher applies, their delivery information
      will appear here for you to review.
    </p>

    <button
      type="button"
      className="shipment-find-dispatch-button"
      onClick={() => navigate("/FindDispatch")}
    >
      Find a Dispatch
      <span>→</span>
    </button>
  </div>
</div>




        {/* ================= SHIPMENT TIMELINE ================= */}

        <section className="shipment-detail-card">

          <div className="detail-card-heading">

            <div>
              <span>SHIPMENT ACTIVITY</span>
              <h2>Current progress</h2>
            </div>

          </div>


          <div className="shipment-detail-timeline">

            <div className="detail-timeline-item completed">

              <span>✓</span>

              <div>
                <strong>Shipment Created</strong>
                <p>{shipment.createdAt}</p>
              </div>

            </div>


            <div className="detail-timeline-item active">

              <span></span>

              <div>
                <strong>Waiting for Dispatch</strong>

                <p>
                  Your shipment is available for a verified
                  dispatch to accept.
                </p>
              </div>

            </div>


            <div className="detail-timeline-item">

              <span></span>

              <div>
                <strong>In Transit</strong>

                <p>
                  Shipment movement will appear here once
                  the dispatch begins the journey.
                </p>
              </div>

            </div>


            <div className="detail-timeline-item">

              <span></span>

              <div>
                <strong>Delivered</strong>

                <p>
                  Delivery confirmation will complete the
                  shipment.
                </p>
              </div>

            </div>

          </div>

        </section>


        {/* ================= DISPUTE ================= */}

        <section className="shipment-dispute-card">

          <div>
            <strong>Need help with this shipment?</strong>

            <p>
              If there is an issue with pickup, delivery,
              payment or the condition of the shipment, you
              can open a dispute for review.
            </p>
          </div>

          <button
            onClick={() =>
              alert(
                "Dispute handling will be connected to the backend later."
              )
            }
          >
            Report an Issue
          </button>

        </section>

      </main>


      {/* ================= BOTTOM NAVIGATION ================= */}

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

export default ShipmentDetails;