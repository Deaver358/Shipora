import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../interceptors/api";
import "../styles/change.css";

function DispatchJobs() {
  const navigate = useNavigate();

  const [filterOpen, setFilterOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [applyingJobId, setApplyingJobId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await api.get("shipments/jobs");

      setJobs(Array.isArray(data) ? data : []);
    } catch (requestError) {
      console.error("Failed to load dispatch jobs:", requestError);

      if (requestError.response?.status === 401) {
        setError("Your session has expired. Please sign in again.");
      } else {
        setError(
          requestError.response?.data?.detail ||
            "We couldn't load available delivery jobs. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (job) => {
    setApplyingJobId(job.shipment_id);
    setError("");
    setSuccessMessage("");

    try {
      await api.post(
        `shipments/${job.shipment_id}/apply`,
        {}
      );

      setSuccessMessage(
        `Application submitted for ${job.tracking_number}.`
      );

      setJobs((currentJobs) =>
        currentJobs.filter(
          (currentJob) =>
            currentJob.shipment_id !== job.shipment_id
        )
      );
    } catch (requestError) {
      console.error("Failed to apply for job:", requestError);

      if (requestError.response?.status === 401) {
        setError("Your session has expired. Please sign in again.");
      } else {
        setError(
          requestError.response?.data?.detail ||
            "We couldn't submit your application. Please try again."
        );
      }
    } finally {
      setApplyingJobId(null);
    }
  };

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
    const normalizedFilter = activeFilter.toLowerCase();

    switch (normalizedFilter) {
      case "motorcycle":
      case "bicycle":
      case "car":
      case "van":
      case "truck":
        return jobs.filter(
          (job) =>
            job.vehicle_preference?.toLowerCase() ===
            normalizedFilter
        );

      case "highest":
        return [...jobs].sort(
          (a, b) => b.delivery_fee - a.delivery_fee
        );

      default:
        return jobs;
    }
  }, [activeFilter, jobs]);

  const topDeliveryFee =
    jobs.length > 0
      ? Math.max(...jobs.map((job) => job.delivery_fee || 0))
      : 0;

  const formatPostedTime = (createdAt) => {
    if (!createdAt) return "Recently posted";

    const created = new Date(createdAt);
    const now = new Date();

    const difference = Math.max(
      0,
      Math.floor((now - created) / 1000)
    );

    const minutes = Math.floor(difference / 60);

    if (minutes < 1) return "Posted just now";
    if (minutes < 60)
      return `Posted ${minutes} min${minutes === 1 ? "" : "s"} ago`;

    const hours = Math.floor(minutes / 60);

    if (hours < 24)
      return `Posted ${hours} hr${hours === 1 ? "" : "s"} ago`;

    const days = Math.floor(hours / 24);

    return `Posted ${days} day${days === 1 ? "" : "s"} ago`;
  };

  return (
    <div className="dispatch-jobs-page">

      {/* HEADER */}

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


      {/* SUMMARY */}

      <section className="dispatch-jobs-summary">

        <div>
          <span>AVAILABLE JOBS</span>
          <strong>{jobs.length}</strong>
        </div>

        <div>
          <span>VEHICLES</span>
          <strong>0</strong>
        </div>

        <div>
          <span>TOP DELIVERY FEE</span>
          <strong>
            ₦{topDeliveryFee.toLocaleString()}
          </strong>
        </div>

      </section>


      {/* CONTENT */}

      <main className="dispatch-jobs-content">

        {error && (
          <div className="dispatch-jobs-error">
            <span>!</span>

            <div>
              <strong>Unable to load jobs</strong>
              <p>{error}</p>
            </div>

            <button
              type="button"
              onClick={loadJobs}
              disabled={loading}
            >
              Retry
            </button>
          </div>
        )}

        {successMessage && (
          <div className="dispatch-jobs-success">
            <span>✓</span>
            <p>{successMessage}</p>

            <button
              type="button"
              onClick={() => setSuccessMessage("")}
              aria-label="Close success message"
            >
              ×
            </button>
          </div>
        )}

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
                    <span>{option.label}</span>

                    {activeFilter === option.value && (
                      <strong>✓</strong>
                    )}
                  </button>
                ))}

              </div>
            )}

          </div>

        </div>


        {/* LOADING */}

        {loading && (
          <div className="dispatch-jobs-loading">

            <div className="dispatch-jobs-spinner"></div>

            <h3>Loading delivery jobs...</h3>

            <p>
              Checking for available shipments.
            </p>

          </div>
        )}


        {/* JOB RESULTS */}

        {!loading && filteredJobs.length > 0 && (

          <div className="dispatch-jobs-grid">

            {filteredJobs.map((job) => {

              const isApplying =
                applyingJobId === job.shipment_id;

              return (
                <article
                  className="dispatch-job-card"
                  key={job.shipment_id}
                >

                  {/* MEDIA */}

                  {job.media && job.media.length > 0 ? (

                    <div className="dispatch-job-media">

                      {job.media.slice(0, 3).map(
                        (media, index) => {

                          const mediaUrl =
                            typeof media === "string"
                              ? media
                              : media?.url;

                          const isVideo =
                            typeof media === "object" &&
                            media?.type?.startsWith("video");

                          return (
                            <div
                              className="dispatch-job-media-item"
                              key={
                                typeof media === "string"
                                  ? `${job.shipment_id}-media-${index}`
                                  : media?.id ||
                                    `${job.shipment_id}-media-${index}`
                              }
                            >
                              {isVideo ? (
                                <video
                                  src={mediaUrl}
                                  controls
                                  preload="metadata"
                                />
                              ) : (
                                <img
                                  src={mediaUrl}
                                  alt={`${job.item_name} ${
                                    index + 1
                                  }`}
                                />
                              )}
                            </div>
                          );
                        }
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


                  {/* BODY */}

                  <div className="dispatch-job-body">

                    <div className="dispatch-job-top">

                      <div>

                        <span>
                          {job.tracking_number}
                        </span>

                        <h3>
                          {job.item_name}
                        </h3>

                      </div>

                      <strong>
                        ₦
                        {Number(
                          job.delivery_fee || 0
                        ).toLocaleString()}
                      </strong>

                    </div>


                    {job.description && (
                      <p className="dispatch-job-description">
                        {job.description}
                      </p>
                    )}


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
                          {job.vehicle_preference ||
                            "Not specified"}
                        </strong>
                      </span>

                      <span>
                        SERVICE FEE
                        <strong>
                          ₦
                          {Number(
                            job.service_fee || 0
                          ).toLocaleString()}
                        </strong>
                      </span>

                      <span>
                        POSTED
                        <strong>
                          {formatPostedTime(
                            job.created_at
                          )}
                        </strong>
                      </span>

                    </div>


                    {/* ACTION */}

                    <button
                      type="button"
                      className="dispatch-job-apply"
                      onClick={() => handleApply(job)}
                      disabled={isApplying}
                    >
                      {isApplying
                        ? "Submitting..."
                        : "Apply for Job"}

                      {!isApplying && <span>→</span>}
                    </button>

                  </div>

                </article>
              );
            })}

          </div>

        )}


        {/* EMPTY */}

        {!loading && filteredJobs.length === 0 && !error && (

          <div className="dispatch-jobs-empty">

            <div>🚚</div>

            <h3>
              {jobs.length === 0
                ? "No delivery jobs available"
                : "No delivery jobs found"}
            </h3>

            <p>
              {jobs.length === 0
                ? "There are currently no open delivery opportunities. Check back soon."
                : "Try another vehicle filter to find available delivery opportunities."}
            </p>

            {jobs.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveFilter("all")}
              >
                View All Jobs
              </button>
            )}

          </div>

        )}

      </main>


      {/* BOTTOM NAV */}

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