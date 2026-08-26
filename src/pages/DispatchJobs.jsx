import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../index.css";

function DispatchJobs() {
  const navigate = useNavigate();

  const [filterOpen, setFilterOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");

  const jobs = [
    {
      id: "JOB-2048-921",
      item: "Electronics",
      description:
        "Sealed electronics package requiring careful handling.",
      pickup: "Lekki Phase 1",
      destination: "Yaba",
      fee: 5000,
      vehicle: "Motorcycle",
      distance: "14 km",
      posted: "Posted 18 mins ago",
      media: [],
    },
    {
      id: "JOB-2048-817",
      item: "Documents",
      description:
        "Business documents in a sealed envelope.",
      pickup: "Victoria Island",
      destination: "Ikeja",
      fee: 3500,
      vehicle: "Motorcycle",
      distance: "17 km",
      posted: "Posted 42 mins ago",
      media: [],
    },
    {
      id: "JOB-2048-604",
      item: "Fashion Items",
      description:
        "Packaged clothing items ready for collection.",
      pickup: "Surulere",
      destination: "Lekki",
      fee: 9000,
      vehicle: "Van",
      distance: "22 km",
      posted: "Posted 1 hr ago",
      media: [],
    },
  ];

  const filterOptions = [
    { value: "all", label: "All Jobs" },
    { value: "motorcycle", label: "Motorcycle" },
    { value: "bicycle", label: "Bicycle" },
    { value: "car", label: "Car" },
    { value: "van", label: "Van" },
    { value: "truck", label: "Truck" },
    { value: "highest", label: "Highest Fee" },
  ];

  const filteredJobs = useMemo(() => {
    switch (activeFilter) {
      case "motorcycle":
      case "bicycle":
      case "car":
      case "van":
      case "truck":
        return jobs.filter(
          (job) =>
            job.vehicle.toLowerCase() === activeFilter
        );

      case "highest":
        return [...jobs].sort(
          (a, b) => b.fee - a.fee
        );

      default:
        return jobs;
    }
  }, [activeFilter]);

  return (
    <div className="dispatch-jobs-page">

      {/* ================= HEADER ================= */}

      <header className="dispatch-jobs-header">

        <button
          type="button"
          className="delivery-details-back"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          ←
        </button>

        <div>
          <span className="dispatch-jobs-eyebrow">
            DELIVERY OPPORTUNITIES
          </span>

          <h1>Dispatch Jobs</h1>

          <p>
            Browse available delivery opportunities and
            apply for jobs that match your route and vehicle.
          </p>
        </div>

        <button
          type="button"
          className="dispatch-jobs-history-button"
          onClick={() => navigate("/my-deliveries")}
        >
          My Deliveries
          <span>→</span>
        </button>

      </header>


      {/* ================= SUMMARY ================= */}

      <section className="dispatch-jobs-summary">

        <div>
          <span>AVAILABLE JOBS</span>
          <strong>{jobs.length}</strong>
        </div>

        <div>
          <span>VEHICLES</span>
          <strong>5</strong>
        </div>

        <div>
          <span>TOP DELIVERY FEE</span>
          <strong>
            ₦
            {Math.max(
              ...jobs.map((job) => job.fee)
            ).toLocaleString()}
          </strong>
        </div>

      </section>


      {/* ================= CONTENT ================= */}

      <main className="dispatch-jobs-content">

        <div className="dispatch-jobs-toolbar">

          <div>
            <span>AVAILABLE NOW</span>
            <h2>Delivery opportunities</h2>
          </div>


          {/* FILTER */}

          <div className="dispatch-jobs-filter-wrapper">

            <button
              type="button"
              className={`dispatch-jobs-filter ${
                filterOpen ? "open" : ""
              }`}
              onClick={() =>
                setFilterOpen((previous) => !previous)
              }
            >
              <span>Filter</span>

              <span>
                {filterOpen ? "⌃" : "⌄"}
              </span>
            </button>


            {filterOpen && (
              <div className="dispatch-jobs-filter-menu">

                {filterOptions.map((option) => (

                  <button
                    type="button"
                    key={option.value}
                    className={
                      activeFilter === option.value
                        ? "selected"
                        : ""
                    }
                    onClick={() => {
                      setActiveFilter(option.value);
                      setFilterOpen(false);
                    }}
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


        {/* ================= JOB RESULTS ================= */}

        {filteredJobs.length > 0 ? (

          <div className="dispatch-jobs-grid">

            {filteredJobs.map((job) => (

              <article
                className="dispatch-job-card"
                key={job.id}
              >

                {/* ================= ITEM MEDIA ================= */}

                {job.media && job.media.length > 0 ? (

                  <div className="dispatch-job-media">

                    {job.media.slice(0, 3).map(
                      (media, index) => (

                        <div
                          className="dispatch-job-media-item"
                          key={
                            media.id ||
                            `${job.id}-media-${index}`
                          }
                        >

                          {media.type?.startsWith(
                            "video"
                          ) ? (

                            <video
                              src={media.url}
                              controls
                              preload="metadata"
                            />

                          ) : (

                            <img
                              src={media.url}
                              alt={`${job.item} ${
                                index + 1
                              }`}
                            />

                          )}

                        </div>

                      )
                    )}

                  </div>

                ) : (

                  <div className="dispatch-job-image">

                    <span>📦</span>

                    <span className="dispatch-job-available">
                      AVAILABLE
                    </span>

                  </div>

                )}


                {/* ================= JOB BODY ================= */}

                <div className="dispatch-job-body">

                  <div className="dispatch-job-top">

                    <div>

                      <span>
                        {job.id}
                      </span>

                      <h3>
                        {job.item}
                      </h3>

                    </div>

                    <strong>
                      ₦{job.fee.toLocaleString()}
                    </strong>

                  </div>


                  <p className="dispatch-job-description">
                    {job.description}
                  </p>


                  {/* ROUTE */}

                  <div className="dispatch-job-route">

                    <div>

                      <span className="dispatch-job-dot pickup"></span>

                      <div>
                        <small>
                          PICKUP AREA
                        </small>

                        <strong>
                          {job.pickup}
                        </strong>
                      </div>

                    </div>


                    <div className="dispatch-job-line"></div>


                    <div>

                      <span className="dispatch-job-dot destination"></span>

                      <div>
                        <small>
                          DESTINATION AREA
                        </small>

                        <strong>
                          {job.destination}
                        </strong>
                      </div>

                    </div>

                  </div>


                  {/* META */}

                  <div className="dispatch-job-meta">

                    <span>
                      VEHICLE
                      <strong>
                        {job.vehicle}
                      </strong>
                    </span>

                    <span>
                      DISTANCE
                      <strong>
                        {job.distance}
                      </strong>
                    </span>

                    <span>
                      POSTED
                      <strong>
                        {job.posted}
                      </strong>
                    </span>

                  </div>


                  {/* ACTION */}

                  <button
                    type="button"
                    className="dispatch-job-apply"
                    onClick={() =>
                      navigate(
                        `/delivery-details/${job.id}?mode=job`
                      )
                    }
                  >
                    View & Apply
                    <span>→</span>
                  </button>

                </div>

              </article>

            ))}

          </div>

        ) : (

          <div className="dispatch-jobs-empty">

            <div>🚚</div>

            <h3>
              No delivery jobs found
            </h3>

            <p>
              Try another vehicle filter to find
              available delivery opportunities.
            </p>

            <button
              type="button"
              onClick={() =>
                setActiveFilter("all")
              }
            >
              View All Jobs
            </button>

          </div>

        )}

      </main>


      {/* ================= BOTTOM NAV ================= */}

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

export default DispatchJobs;