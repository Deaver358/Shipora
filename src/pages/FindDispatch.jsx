import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../index.css";

function FindDispatch() {
  const navigate = useNavigate();

  const [filterOpen, setFilterOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");

  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [selectedDispatcher, setSelectedDispatcher] = useState(null);
  const [applicationFiles, setApplicationFiles] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);

  const [application, setApplication] = useState({
    pickup: "",
    destination: "",
    packageDescription: "",
    amount: "",
    note: "",
  });

  const dispatchers = [
    {
      id: 7,
      name: "Alex B.",
      rating: 4.7,
      deliveries: 82,
      pickup: "Ikorodu",
      serviceArea: "Lagos Mainland",
      vehicle: "Bicycle",
      fee: 3000,
      availability: "Available today",
      verified: true,
    },
    {
      id: 8,
      name: "Daniel V.",
      rating: 4.8,
      deliveries: 117,
      pickup: "Ajah",
      serviceArea: "Victoria Island",
      vehicle: "Van",
      fee: 9000,
      availability: "Available today",
      verified: true,
    },
    {
      id: 9,
      name: "Samuel T.",
      rating: 4.9,
      deliveries: 156,
      pickup: "Ikeja",
      serviceArea: "Lekki",
      vehicle: "Truck",
      fee: 15000,
      availability: "Available tomorrow",
      verified: true,
    },
  ];

  const filteredDispatchers = useMemo(() => {
    switch (activeFilter) {
      case "today":
        return dispatchers.filter(
          (dispatcher) =>
            dispatcher.availability === "Available today"
        );

      case "tomorrow":
        return dispatchers.filter(
          (dispatcher) =>
            dispatcher.availability === "Available tomorrow"
        );

      case "motorcycle":
        return dispatchers.filter(
          (dispatcher) =>
            dispatcher.vehicle === "Motorcycle"
        );

      case "bicycle":
        return dispatchers.filter(
          (dispatcher) =>
            dispatcher.vehicle === "Bicycle"
        );

      case "car":
        return dispatchers.filter(
          (dispatcher) =>
            dispatcher.vehicle === "Car"
        );

      case "van":
        return dispatchers.filter(
          (dispatcher) =>
            dispatcher.vehicle === "Van"
        );

      case "truck":
        return dispatchers.filter(
          (dispatcher) =>
            dispatcher.vehicle === "Truck"
        );

      case "rated":
        return [...dispatchers].sort(
          (a, b) => b.rating - a.rating
        );

      default:
        return dispatchers;
    }
  }, [activeFilter]);

  const filterOptions = [
    {
      value: "all",
      label: "All Dispatchers",
    },
    {
      value: "today",
      label: "Available Today",
    },
    {
      value: "tomorrow",
      label: "Available Tomorrow",
    },
    {
      value: "motorcycle",
      label: "Motorcycle",
    },
    {
      value: "bicycle",
      label: "Bicycle",
    },
    {
      value: "car",
      label: "Car",
    },
    {
      value: "van",
      label: "Van",
    },
    {
      value: "truck",
      label: "Truck",
    },
    {
      value: "rated",
      label: "Highest Rated",
    },
  ];

  const handleFilter = (value) => {
    setActiveFilter(value);
    setFilterOpen(false);
  };

  const handleOpenApplication = (dispatcher) => {
    setSelectedDispatcher(dispatcher);
    setApplicationFiles([]);

    setApplication({
      pickup: "",
      destination: "",
      packageDescription: "",
      amount: "",
      note: "",
    });

    setApplyModalOpen(true);
  };

  const handleCloseApplication = () => {
    setApplyModalOpen(false);
    setSelectedDispatcher(null);
    setApplicationFiles([]);
  };

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files);

    if (selectedFiles.length > 3) {
      alert("You can only upload a maximum of 3 files.");
      event.target.value = "";
      return;
    }

    setApplicationFiles(selectedFiles);
  };

  const handleApplication = (event) => {
    event.preventDefault();

    console.log({
      dispatcher: selectedDispatcher,
      application,
      files: applicationFiles,
    });

    alert("Application sent successfully!");

    handleCloseApplication();
  };

  return (
    <div className="find-dispatch-page">
      <button
  type="button"
  className="white-page-back-button"
  onClick={() => navigate(-1)}
  aria-label="Go back"
>
  ←
</button> <br />

      {/* ================= HEADER ================= */}

      <header className="find-dispatch-header">

        <div>
          <span className="find-dispatch-eyebrow">
            AVAILABLE NOW
          </span>

          <h1>
            Dispatchers near your route
          </h1>

          <p>
            Find verified dispatchers available for your
            shipment and compare their service details.
          </p>
        </div>

      </header>


      {/* ================= DISPATCHER CONTENT ================= */}

      <main className="find-dispatch-content">

        <div className="find-dispatch-heading">

          <div>
            <span>AVAILABLE DISPATCH</span>

            <h2>
              Find a dispatcher
            </h2>
          </div>


          {/* FILTER */}

          <div className="find-dispatch-filter-wrapper">

            <button
              type="button"
              className={`find-dispatch-filter ${
                filterOpen ? "open" : ""
              }`}
              onClick={() =>
                setFilterOpen(!filterOpen)
              }
            >
              <span>Filter</span>

              <span className="find-filter-arrow">
                {filterOpen ? "⌃" : "⌄"}
              </span>
            </button>


            {filterOpen && (

              <div className="find-dispatch-filter-menu">

                {filterOptions.map((option) => (

                  <button
                    type="button"
                    key={option.value}
                    className={
                      activeFilter === option.value
                        ? "selected"
                        : ""
                    }
                    onClick={() =>
                      handleFilter(option.value)
                    }
                  >
                    <span>
                      {option.label}
                    </span>

                    {activeFilter === option.value && (
                      <strong>✓</strong>
                    )}
                  </button>

                ))}

              </div>

            )}

          </div>

        </div>


        {/* ================= RESULTS ================= */}

        {filteredDispatchers.length > 0 ? (

          <div className="find-dispatch-grid">

            {filteredDispatchers.map((dispatcher) => (

              <article
                className="find-dispatch-card"
                key={dispatcher.id}
              >

                {/* CARD TOP */}

                <div className="find-dispatch-card-top">

                  <div className="find-dispatch-avatar">
                    {dispatcher.name.charAt(0)}
                  </div>


                  <div className="find-dispatch-person">

                    <div className="find-dispatch-name">

                      <strong>
                        {dispatcher.name}
                      </strong>

                      {dispatcher.verified && (
                        <span className="find-dispatch-verified">
                          ✓ Verified
                        </span>
                      )}

                    </div>


                    <div className="find-dispatch-rating">

                      <span>★</span>

                      <strong>
                        {dispatcher.rating}
                      </strong>

                      <small>
                        · {dispatcher.deliveries} deliveries
                      </small>

                    </div>

                  </div>

                </div>


                {/* ROUTE */}

                <div className="find-dispatch-route">

                  <div className="find-route-point">

                    <span className="find-route-dot pickup"></span>

                    <div>
                      <small>
                        PICKUP AREA
                      </small>

                      <strong>
                        {dispatcher.pickup}
                      </strong>
                    </div>

                  </div>


                  <div className="find-route-line">
                    <span></span>
                  </div>


                  <div className="find-route-point">

                    <span className="find-route-dot destination"></span>

                    <div>
                      <small>
                        SERVICE AREA
                      </small>

                      <strong>
                        {dispatcher.serviceArea}
                      </strong>
                    </div>

                  </div>

                </div>


                {/* DETAILS */}

                <div className="find-dispatch-details">

                  <div>
                    <span>VEHICLE</span>

                    <strong>
                      {dispatcher.vehicle}
                    </strong>
                  </div>


                  <div>
                    <span>DELIVERY FEE</span>

                    <strong>
                      ₦{dispatcher.fee.toLocaleString()}
                    </strong>
                  </div>


                  <div>
                    <span>AVAILABILITY</span>

                    <strong className="find-available-status">
                      {dispatcher.availability}
                    </strong>
                  </div>

                </div>


                {/* ACTION */}

                <button
                  type="button"
                  className="find-dispatch-button"
                  onClick={() =>
                    handleOpenApplication(dispatcher)
                  }
                >
                  View & Apply
                  <span>→</span>
                </button>

              </article>

            ))}

          </div>

        ) : (

          <div className="find-dispatch-empty">

            <div>
              🚚
            </div>

            <h3>
              No dispatchers found
            </h3>

            <p>
              Try another filter to find an available
              dispatcher for your route.
            </p>

            <button
              type="button"
              onClick={() => setActiveFilter("all")}
            >
              View All Dispatchers
            </button>

          </div>

        )}

      </main>


      {/* ================= APPLICATION MODAL ================= */}

      {applyModalOpen && selectedDispatcher && (

        <div
          className="dispatch-modal-overlay"
          onClick={handleCloseApplication}
        >

          <div
            className="dispatch-modal application-modal"
            onClick={(event) => event.stopPropagation()}
          >

            <div className="dispatch-modal-header">

              <div>
                <span>DISPATCHER</span>

                <h2>
                  {selectedDispatcher.name}
                </h2>
              </div>

              <button
                type="button"
                className="dispatch-modal-close"
                onClick={handleCloseApplication}
              >
                ×
              </button>

            </div>


            <div className="dispatch-detail-summary">

              <div>
                <span>RATING</span>

                <strong>
                  ★ {selectedDispatcher.rating}
                </strong>
              </div>


              <div>
                <span>DELIVERIES</span>

                <strong>
                  {selectedDispatcher.deliveries}
                </strong>
              </div>


              <div>
                <span>VEHICLE</span>

                <strong>
                  {selectedDispatcher.vehicle}
                </strong>
              </div>


              <div>
                <span>RATE</span>

                <strong>
                  ₦{selectedDispatcher.fee.toLocaleString()}
                </strong>
              </div>

            </div>


            <div className="dispatch-route-summary">

              <strong>
                {selectedDispatcher.pickup}
              </strong>

              <span>→</span>

              <strong>
                {selectedDispatcher.serviceArea}
              </strong>

            </div>


            <p className="dispatch-modal-intro">
              If this dispatcher fits your shipment, provide the
              shipment details below and send an application.
              The dispatcher can review the request before accepting it.
            </p>


            <form onSubmit={handleApplication}>

              <div className="dispatch-form-grid">

                <label>
                  Pickup Location

                  <input
                    type="text"
                    placeholder="Full pickup location"
                    value={application.pickup}
                    onChange={(event) =>
                      setApplication({
                        ...application,
                        pickup: event.target.value,
                      })
                    }
                    required
                  />

                </label>


                <label>
                  Destination

                  <input
                    type="text"
                    placeholder="Full delivery location"
                    value={application.destination}
                    onChange={(event) =>
                      setApplication({
                        ...application,
                        destination: event.target.value,
                      })
                    }
                    required
                  />

                </label>


                <label>
                  Package Description

                  <input
                    type="text"
                    placeholder="e.g. Clothing package"
                    value={application.packageDescription}
                    onChange={(event) =>
                      setApplication({
                        ...application,
                        packageDescription: event.target.value,
                      })
                    }
                    required
                  />

                </label>


                <label>
                  Amount You Can Pay

                  <input
                    type="number"
                    placeholder="Input amount  e.g. ₦5,000"
                    value={application.amount}
                    onChange={(event) =>
                      setApplication({
                        ...application,
                        amount: event.target.value,
                      })
                    }
                    required
                  />

                </label>

              </div>


              <label className="dispatch-full-field">
                Message to Dispatcher

                <textarea
                  placeholder="Add any information the dispatcher should know..."
                  value={application.note}
                  onChange={(event) =>
                    setApplication({
                      ...application,
                      note: event.target.value,
                    })
                  }
                ></textarea>

              </label>


              {/* ================= FILE UPLOAD SECTION ================= */}

              <label className="dispatch-upload-section">

                <span className="dispatch-upload-title">
                  Upload Item
                </span>

                <span className="dispatch-upload-description">
                  Upload up to 3 images or videos.
                </span>

                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleFileChange}
                  className="dispatch-file-input"
                />

              </label>

{applicationFiles.length > 0 && (

  <div className="dispatch-uploaded-files">

    {applicationFiles.map((file, index) => {

      const fileUrl = URL.createObjectURL(file);

      return (

        <div
          className="dispatch-uploaded-file"
          key={index}
        >

          {file.type.startsWith("image/") ? (

            <img
              src={fileUrl}
              alt={`Upload ${index + 1}`}
              className="dispatch-upload-preview"
              onClick={() =>
                setPreviewFile({
                  type: "image",
                  url: fileUrl,
                })
              }
            />

          ) : (

            <video
              src={fileUrl}
              className="dispatch-upload-preview"
              onClick={() =>
                setPreviewFile({
                  type: "video",
                  url: fileUrl,
                })
              }
            />

          )}

        </div>

      );

    })}

  </div>

)}


              <div className="dispatch-modal-actions">

                <button
                  type="button"
                  className="dispatch-cancel-button"
                  onClick={handleCloseApplication}
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="dispatch-submit-button"
                >
                  Send Application
                  <span>→</span>
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* ================= FILE PREVIEW MODAL ================= */}

{previewFile && (

  <div
    className="file-preview-overlay"
    onClick={() => setPreviewFile(null)}
  >

    <div
      className="file-preview-modal"
      onClick={(event) => event.stopPropagation()}
    >

      <button
        type="button"
        className="file-preview-close"
        onClick={() => setPreviewFile(null)}
      >
        ×
      </button>


      {previewFile.type === "image" ? (

        <img
          src={previewFile.url}
          alt="Full preview"
          className="file-preview-full"
        />

      ) : (

        <video
          src={previewFile.url}
          controls
          autoPlay
          className="file-preview-full"
        />

      )}

    </div>

  </div>

)}


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

export default FindDispatch;