import { useEffect, useMemo, useState } from "react";
import "../index.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1.0";

function getAuthHeaders() {
  const token =
    localStorage.getItem("access_token") ||
    localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function formatDate(value) {
  if (!value) return "—";

  try {
    return new Date(value).toLocaleString("en-NG", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return value;
  }
}

function displayName(profile) {
  return [
    profile.first_name,
    profile.middle_name,
    profile.surname,
  ]
    .filter(Boolean)
    .join(" ") || "Unnamed user";
}

function profileLabel(type) {
  if (type === "both") return "Vendor + Dispatcher";
  if (type === "dispatcher") return "Dispatcher";
  return "Vendor";
}

function normalizeStatus(status) {
  return String(status || "pending").toLowerCase();
}

function StatusBadge({ status }) {
  const normalized = normalizeStatus(status);

  const labels = {
    verified: "Verified",
    pending: "Pending",
    review_required: "Review Required",
    rejected: "Rejected",
  };

  return (
    <span className={`kyc-status status-${normalized}`}>
      <span className="status-dot" />
      {labels[normalized] || normalized.replaceAll("_", " ")}
    </span>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 12.5 9.2 17 19 7"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
      <circle
        cx="12"
        cy="8"
        r="3.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M5 20c.8-3.4 3.1-5.2 7-5.2s6.2 1.8 7 5.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
      <path
        d="M7 3.5h7l4 4V20.5H7z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M14 3.5v4h4M9.5 12h5M9.5 15.5h5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function VehicleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
      <path
        d="m5 16 1.5-6h11L19 16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M4 16h16v3H4zM7.5 19v1.5M16.5 19v1.5M7 13h10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
      <circle
        cx="10.8"
        cy="10.8"
        r="6.3"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="m16 16 4.2 4.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
      <path
        d="M6 6l12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function KycCard({ profile, onOpen }) {
  const ninStatus = normalizeStatus(profile.nin_verification_status);
  const cacStatus = normalizeStatus(profile.cac_verification_status);
  const vehicleStatus = normalizeStatus(
    profile.vehicle_verification_status
  );

  const hasAttention =
    ninStatus === "pending" ||
    ninStatus === "review_required" ||
    cacStatus === "pending" ||
    cacStatus === "review_required" ||
    vehicleStatus === "pending" ||
    vehicleStatus === "review_required";

  return (
    <button
      type="button"
      className={`kyc-card ${hasAttention ? "needs-attention" : ""}`}
      onClick={() => onOpen(profile)}
    >
      <div className="kyc-card-top">
        <div className="profile-avatar">
          {displayName(profile).charAt(0).toUpperCase()}
        </div>

        <div className="profile-main">
          <div className="profile-name-row">
            <h3>{displayName(profile)}</h3>

            <span className="profile-type">
              {profileLabel(profile.profile_type)}
            </span>
          </div>

          <p>{profile.email || "No email"}</p>
        </div>

        <span className="view-arrow">›</span>
      </div>

      <div className="verification-summary">
        <div className="mini-verification">
          <span className="mini-icon">
            <UserIcon />
          </span>

          <div>
            <small>Identity</small>
            <strong>NIN</strong>
          </div>

          <StatusBadge status={profile.nin_verification_status} />
        </div>

        {(profile.profile_type === "vendor" ||
          profile.profile_type === "both") && (
          <div className="mini-verification">
            <span className="mini-icon">
              <DocumentIcon />
            </span>

            <div>
              <small>Business</small>
              <strong>CAC</strong>
            </div>

            <StatusBadge status={profile.cac_verification_status} />
          </div>
        )}

        {(profile.profile_type === "dispatcher" ||
          profile.profile_type === "both") && (
          <div className="mini-verification">
            <span className="mini-icon">
              <VehicleIcon />
            </span>

            <div>
              <small>Vehicle</small>
              <strong>Documents</strong>
            </div>

            <StatusBadge status={profile.vehicle_verification_status} />
          </div>
        )}
      </div>

      <div className="kyc-card-footer">
        <span>
          Updated {formatDate(profile.updated_at)}
        </span>

        <span className="review-link">
          Review application →
        </span>
      </div>
    </button>
  );
}

export default function AdminKYC() {
  const [applications, setApplications] = useState([]);
  const [selected, setSelected] = useState(null);

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const [showReject, setShowReject] = useState(false);
  const [rejectDocument, setRejectDocument] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  async function loadApplications() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/admin/kyc`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));

        throw new Error(
          body.detail || "Unable to load KYC applications."
        );
      }

      const data = await response.json();

      setApplications(
        Array.isArray(data.applications)
          ? data.applications
          : []
      );
    } catch (err) {
      setError(
        err.message || "Unable to load KYC applications."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadApplications();
  }, []);

  const stats = useMemo(() => {
    let pending = 0;
    let review = 0;
    let rejected = 0;
    let verified = 0;

    applications.forEach((profile) => {
      const statuses = [
        profile.nin_verification_status,
        profile.cac_verification_status,
        profile.vehicle_verification_status,
      ].filter(Boolean);

      statuses.forEach((value) => {
        const status = normalizeStatus(value);

        if (status === "pending") pending += 1;
        if (status === "review_required") review += 1;
        if (status === "rejected") rejected += 1;
        if (status === "verified") verified += 1;
      });
    });

    return {
      applications: applications.length,
      pending,
      review,
      rejected,
      verified,
    };
  }, [applications]);

  const filteredApplications = useMemo(() => {
    const query = search.trim().toLowerCase();

    return applications.filter((profile) => {
      const matchesSearch =
        !query ||
        displayName(profile).toLowerCase().includes(query) ||
        String(profile.email || "")
          .toLowerCase()
          .includes(query) ||
        String(profile.phone || "")
          .toLowerCase()
          .includes(query) ||
        String(profile.nin || "")
          .toLowerCase()
          .includes(query) ||
        String(profile.cac_number || "")
          .toLowerCase()
          .includes(query) ||
        String(profile.vehicle_registration || "")
          .toLowerCase()
          .includes(query);

      const profileStatuses = [
        profile.nin_verification_status,
        profile.cac_verification_status,
        profile.vehicle_verification_status,
      ].map(normalizeStatus);

      const matchesStatus =
        statusFilter === "all" ||
        profileStatuses.includes(statusFilter);

      const matchesType =
        typeFilter === "all" ||
        profile.profile_type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [
    applications,
    search,
    statusFilter,
    typeFilter,
  ]);

  function openProfile(profile) {
    setSelected(profile);
    setActionMessage("");
    setError("");
    setShowReject(false);
    setRejectDocument("");
    setRejectReason("");
  }

  function closeProfile() {
    if (processing) return;

    setSelected(null);
    setShowReject(false);
    setRejectDocument("");
    setRejectReason("");
  }

  async function performAction(
    documentType,
    action,
    reason = ""
  ) {
    if (!selected) return;

    setProcessing(true);
    setActionMessage("");
    setError("");

    try {
      let url =
        `${API_URL}/admin/kyc/` +
        `${selected.profile_type}/` +
        `${selected.profile_id}/` +
        `${documentType}/` +
        action;

      if (action === "reject") {
        const params = new URLSearchParams({
          reason: reason.trim(),
        });

        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        method: "POST",
        headers: getAuthHeaders(),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.detail ||
            `Unable to ${action} ${documentType}.`
        );
      }

      setActionMessage(
        data.message ||
          `${documentType.toUpperCase()} ${action} successful.`
      );

      await loadApplications();

      if (data.profile) {
        setSelected(data.profile);
      } else {
        const refreshed = applications.find(
          (item) =>
            item.profile_id === selected.profile_id &&
            item.profile_type === selected.profile_type
        );

        if (refreshed) {
          setSelected(refreshed);
        }
      }

      setShowReject(false);
      setRejectDocument("");
      setRejectReason("");
    } catch (err) {
      setError(
        err.message ||
          `Unable to ${action} ${documentType}.`
      );
    } finally {
      setProcessing(false);
    }
  }

  function requestReject(documentType) {
    setRejectDocument(documentType);
    setRejectReason("");
    setShowReject(true);
    setActionMessage("");
    setError("");
  }

  async function confirmReject() {
    if (!rejectReason.trim()) {
      setError("Please provide a rejection reason.");
      return;
    }

    await performAction(
      rejectDocument,
      "reject",
      rejectReason
    );
  }

  function documentActions(documentType, currentStatus) {
    const normalized = normalizeStatus(currentStatus);

    if (normalized === "verified") {
      return (
        <div className="verified-message">
          <span className="verified-check">
            <CheckIcon />
          </span>
          This verification has been approved.
        </div>
      );
    }

    return (
      <div className="document-actions">
        {documentType !== "vehicle" && (
          <button
            type="button"
            className="action-button retry-button"
            disabled={processing}
            onClick={() =>
              performAction(documentType, "retry")
            }
          >
            Retry
          </button>
        )}

        <button
          type="button"
          className="action-button reject-button"
          disabled={processing}
          onClick={() => requestReject(documentType)}
        >
          Reject
        </button>

        <button
          type="button"
          className="action-button approve-button"
          disabled={processing}
          onClick={() =>
            performAction(documentType, "approve")
          }
        >
          <CheckIcon />
          Approve
        </button>
      </div>
    );
  }

  function renderVerificationCard({
    type,
    title,
    icon,
    status,
    children,
  }) {
    return (
      <section className="verification-card">
        <div className="verification-card-header">
          <div className="verification-title">
            <span className="verification-icon">
              {icon}
            </span>

            <div>
              <h3>{title}</h3>
              <StatusBadge status={status} />
            </div>
          </div>
        </div>

        <div className="verification-content">
          {children}
        </div>

        <div className="verification-footer">
          {documentActions(type, status)}
        </div>
      </section>
    );
  }

  return (
    <div className="admin-kyc-page">
      <div className="admin-kyc-container">
        <header className="admin-kyc-header">
          <div>
            <span className="admin-eyebrow">
              ADMINISTRATION
            </span>

            <h1>KYC Verification</h1>

            <p>
              Review identity, business and vehicle
              verification submissions.
            </p>
          </div>

          <button
            type="button"
            className="refresh-button"
            onClick={loadApplications}
            disabled={loading}
          >
            ↻ Refresh
          </button>
        </header>

        {error && !selected && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {actionMessage && !selected && (
          <div className="alert alert-success">
            {actionMessage}
          </div>
        )}

        <section className="stats-grid">
          <div className="stat-card">
            <span>Total Profiles</span>
            <strong>{stats.applications}</strong>
          </div>

          <div className="stat-card">
            <span>Pending</span>
            <strong>{stats.pending}</strong>
          </div>

          <div className="stat-card">
            <span>Review Required</span>
            <strong>{stats.review}</strong>
          </div>

          <div className="stat-card">
            <span>Rejected</span>
            <strong>{stats.rejected}</strong>
          </div>

          <div className="stat-card">
            <span>Verified Checks</span>
            <strong>{stats.verified}</strong>
          </div>
        </section>

        <section className="filters-panel">
          <div className="search-box">
            <SearchIcon />

            <input
              type="text"
              placeholder="Search name, email, NIN, CAC or vehicle..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="review_required">
              Review required
            </option>
            <option value="rejected">Rejected</option>
            <option value="verified">Verified</option>
          </select>

          <select
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(event.target.value)
            }
          >
            <option value="all">All profiles</option>
            <option value="vendor">Vendor</option>
            <option value="dispatcher">Dispatcher</option>
            <option value="both">Vendor + Dispatcher</option>
          </select>
        </section>

        <div className="results-heading">
          <div>
            <h2>KYC Applications</h2>
            <span>
              {filteredApplications.length} profile
              {filteredApplications.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">
            <div className="loader" />
            <p>Loading KYC applications...</p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <CheckIcon />
            </div>

            <h3>No applications found</h3>

            <p>
              There are no KYC profiles matching your
              current filters.
            </p>
          </div>
        ) : (
          <div className="kyc-list">
            {filteredApplications.map((profile) => (
              <KycCard
                key={`${profile.profile_type}-${profile.profile_id}`}
                profile={profile}
                onOpen={openProfile}
              />
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeProfile();
            }
          }}
        >
          <div className="kyc-modal">
            <div className="modal-header">
              <div className="modal-user">
                <div className="modal-avatar">
                  {displayName(selected)
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div>
                  <span className="modal-type">
                    {profileLabel(selected.profile_type)}
                  </span>

                  <h2>{displayName(selected)}</h2>

                  <p>{selected.email}</p>
                </div>
              </div>

              <button
                type="button"
                className="close-button"
                onClick={closeProfile}
                disabled={processing}
              >
                <CloseIcon />
              </button>
            </div>

            <div className="modal-body">
              {error && (
                <div className="alert alert-error">
                  {error}
                </div>
              )}

              {actionMessage && (
                <div className="alert alert-success">
                  {actionMessage}
                </div>
              )}

              <section className="personal-details">
                <div className="section-heading">
                  <h3>Applicant information</h3>
                </div>

                <div className="details-grid">
                  <div>
                    <span>Full name</span>
                    <strong>{displayName(selected)}</strong>
                  </div>

                  <div>
                    <span>Email</span>
                    <strong>{selected.email || "—"}</strong>
                  </div>

                  <div>
                    <span>Phone</span>
                    <strong>{selected.phone || "—"}</strong>
                  </div>

                  <div>
                    <span>Date of birth</span>
                    <strong>
                      {selected.date_of_birth || "—"}
                    </strong>
                  </div>

                  <div>
                    <span>Profile</span>
                    <strong>
                      {profileLabel(selected.profile_type)}
                    </strong>
                  </div>

                  <div>
                    <span>Submitted</span>
                    <strong>
                      {formatDate(selected.created_at)}
                    </strong>
                  </div>
                </div>
              </section>

              {renderVerificationCard({
                type: "nin",
                title: "NIN Identity Verification",
                icon: <UserIcon />,
                status: selected.nin_verification_status,
                children: (
                  <div className="document-details">
                    <div>
                      <span>NIN</span>
                      <strong>
                        {selected.nin || "Not provided"}
                      </strong>
                    </div>

                    <div>
                      <span>Provider reference</span>
                      <strong>
                        {selected.nin_verification_ref ||
                          "No reference"}
                      </strong>
                    </div>
                  </div>
                ),
              })}

              {(selected.profile_type === "vendor" ||
                selected.profile_type === "both") &&
                renderVerificationCard({
                  type: "cac",
                  title: "CAC Business Verification",
                  icon: <DocumentIcon />,
                  status: selected.cac_verification_status,
                  children: (
                    <div className="document-details">
                      <div>
                        <span>Business name</span>
                        <strong>
                          {selected.business_name ||
                            "Not provided"}
                        </strong>
                      </div>

                      <div>
                        <span>CAC number</span>
                        <strong>
                          {selected.cac_number ||
                            "Not provided"}
                        </strong>
                      </div>

                      <div>
                        <span>Provider reference</span>
                        <strong>
                          {selected.cac_verification_ref ||
                            "No reference"}
                        </strong>
                      </div>
                    </div>
                  ),
                })}

              {(selected.profile_type === "dispatcher" ||
                selected.profile_type === "both") &&
                renderVerificationCard({
                  type: "vehicle",
                  title: "Vehicle Verification",
                  icon: <VehicleIcon />,
                  status:
                    selected.vehicle_verification_status,
                  children: (
                    <div className="document-details">
                      <div>
                        <span>Vehicle type</span>
                        <strong>
                          {selected.vehicle_type || "—"}
                        </strong>
                      </div>

                      <div>
                        <span>Registration</span>
                        <strong>
                          {selected.vehicle_registration ||
                            "—"}
                        </strong>
                      </div>

                      <div>
                        <span>Document</span>

                        {selected.vehicle_document_url ? (
                          <a
                            href={
                              selected.vehicle_document_url
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="document-link"
                            onClick={(event) =>
                              event.stopPropagation()
                            }
                          >
                            View document ↗
                          </a>
                        ) : (
                          <strong>No document uploaded</strong>
                        )}
                      </div>

                      {selected.vehicle_rejection_reason && (
                        <div className="rejection-reason">
                          <span>Previous rejection reason</span>
                          <strong>
                            {selected.vehicle_rejection_reason}
                          </strong>
                        </div>
                      )}
                    </div>
                  ),
                })}

              <div className="modal-updated">
                Last updated:{" "}
                {formatDate(selected.updated_at)}
              </div>
            </div>
          </div>
        </div>
      )}

      {showReject && selected && (
        <div className="reject-backdrop">
          <div className="reject-modal">
            <div className="reject-header">
              <div>
                <span>REJECT VERIFICATION</span>
                <h2>
                  Reject{" "}
                  {rejectDocument.toUpperCase()}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowReject(false)}
                disabled={processing}
              >
                <CloseIcon />
              </button>
            </div>

            <p>
              Give the applicant a clear reason so they know
              what needs to be corrected.
            </p>

            <textarea
              value={rejectReason}
              onChange={(event) =>
                setRejectReason(event.target.value)
              }
              placeholder="Enter rejection reason..."
              rows={5}
              autoFocus
            />

            <div className="reject-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={() => setShowReject(false)}
                disabled={processing}
              >
                Cancel
              </button>

              <button
                type="button"
                className="confirm-reject-button"
                onClick={confirmReject}
                disabled={
                  processing || !rejectReason.trim()
                }
              >
                {processing
                  ? "Rejecting..."
                  : "Confirm rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}