import { useCallback, useEffect, useMemo, useState } from "react";
import "../index.css";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8000/api/v1";

const ACTIVE_STATUSES = [
  "open",
  "under_review",
  "in_consideration",
];

const STATUS_LABELS = {
  open: "OPEN",
  under_review: "UNDER REVIEW",
  in_consideration: "IN CONSIDERATION",
  resolved: "RESOLVED",
};

const ACTION_LABELS = {
  release: "RELEASE FUNDS",
  refund: "REFUND CUSTOMER",
};

function getToken() {
  return (
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("access_token") ||
    sessionStorage.getItem("token") ||
    ""
  );
}

function getValue(value, fallback = "—") {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  return value;
}

function formatStatus(status) {
  const value =
    typeof status === "string"
      ? status.toLowerCase()
      : status?.value?.toLowerCase();

  return STATUS_LABELS[value] || String(value || "UNKNOWN").replaceAll("_", " ");
}

function formatAction(action) {
  const value =
    typeof action === "string"
      ? action.toLowerCase()
      : action?.value?.toLowerCase();

  return ACTION_LABELS[value] || String(value || "—").replaceAll("_", " ");
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatMoney(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const numeric = Number(value);

  if (Number.isNaN(numeric)) {
    return value;
  }

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(numeric / 100);
}

function getStatusClass(status) {
  const value =
    typeof status === "string"
      ? status.toLowerCase()
      : status?.value?.toLowerCase();

  return `status-${value || "unknown"}`;
}

function getPersonName(person, fallback = "Not available") {
  if (!person) return fallback;

  if (person.name) return person.name;
  if (person.fullname) return person.fullname;

  const parts = [
    person.first_name,
    person.middle_name,
    person.surname,
    person.last_name,
  ].filter(Boolean);

  return parts.length ? parts.join(" ") : fallback;
}

function getShipmentTitle(dispute) {
  return (
    dispute.item_description ||
    dispute.package_description ||
    dispute.shipment_description ||
    dispute.item ||
    dispute.shipment?.item_description ||
    "Shipment"
  );
}

export default function AdminDisputes() {
  const [disputes, setDisputes] = useState([]);
  const [selectedDispute, setSelectedDispute] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolutionAction, setResolutionAction] = useState("release");
  const [resolutionNote, setResolutionNote] = useState("");

  const [resolving, setResolving] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const authHeaders = useMemo(() => {
    const token = getToken();

    return {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
    };
  }, []);

  const fetchDisputes = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response = await fetch(
          `${API_BASE}/disputes/admin/all`,
          {
            method: "GET",
            credentials: "include",
            headers: authHeaders,
          }
        );

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.detail ||
              data?.message ||
              `Unable to load disputes (${response.status})`
          );
        }

        setDisputes(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(
          err?.message ||
            "Unable to load disputes. Please try again."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [authHeaders]
  );

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const filteredDisputes = useMemo(() => {
    const query = search.trim().toLowerCase();

    return disputes.filter((dispute) => {
      const status =
        typeof dispute.status === "string"
          ? dispute.status.toLowerCase()
          : dispute.status?.value?.toLowerCase();

      const matchesFilter =
        filter === "all" || status === filter;

      if (!matchesFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      const searchable = [
        dispute.dispute_id,
        dispute.shipment_id,
        dispute.tracking_number,
        dispute.reason,
        dispute.description,
        dispute.vendor_name,
        dispute.vendor_phone,
        dispute.dispatcher_name,
        dispute.dispatcher_phone,
        dispute.vendor?.name,
        dispute.vendor?.phone,
        dispute.dispatcher?.name,
        dispute.dispatcher?.phone,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [disputes, filter, search]);

  const counts = useMemo(() => {
    return {
      all: disputes.length,
      open: disputes.filter((item) => {
        const status =
          typeof item.status === "string"
            ? item.status.toLowerCase()
            : item.status?.value?.toLowerCase();

        return status === "open";
      }).length,
      under_review: disputes.filter((item) => {
        const status =
          typeof item.status === "string"
            ? item.status.toLowerCase()
            : item.status?.value?.toLowerCase();

        return status === "under_review";
      }).length,
      in_consideration: disputes.filter((item) => {
        const status =
          typeof item.status === "string"
            ? item.status.toLowerCase()
            : item.status?.value?.toLowerCase();

        return status === "in_consideration";
      }).length,
      resolved: disputes.filter((item) => {
        const status =
          typeof item.status === "string"
            ? item.status.toLowerCase()
            : item.status?.value?.toLowerCase();

        return status === "resolved";
      }).length,
    };
  }, [disputes]);

  const updateStatus = async (status) => {
    if (!selectedDispute) return;

    try {
      setUpdatingStatus(true);
      setActionError("");

      const response = await fetch(
        `${API_BASE}/disputes/admin/${selectedDispute.dispute_id}/status`,
        {
          method: "PATCH",
          credentials: "include",
          headers: authHeaders,
          body: JSON.stringify({
            status,
          }),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            "Unable to update dispute status."
        );
      }

      setSelectedDispute(data);

      setDisputes((current) =>
        current.map((item) =>
          item.dispute_id === data.dispute_id
            ? data
            : item
        )
      );
    } catch (err) {
      setActionError(
        err?.message || "Unable to update dispute status."
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const openResolveModal = () => {
    setActionError("");
    setResolutionAction("release");
    setResolutionNote("");
    setShowResolveModal(true);
  };

  const resolveDispute = async () => {
    if (!selectedDispute) return;

    try {
      setResolving(true);
      setActionError("");

      const response = await fetch(
        `${API_BASE}/disputes/admin/${selectedDispute.dispute_id}/resolve`,
        {
          method: "POST",
          credentials: "include",
          headers: authHeaders,
          body: JSON.stringify({
            action: resolutionAction,
            note: resolutionNote.trim() || null,
          }),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            "Unable to resolve dispute."
        );
      }

      setSelectedDispute(data);

      setDisputes((current) =>
        current.map((item) =>
          item.dispute_id === data.dispute_id
            ? data
            : item
        )
      );

      setShowResolveModal(false);
      setResolutionNote("");
    } catch (err) {
      setActionError(
        err?.message || "Unable to resolve dispute."
      );
    } finally {
      setResolving(false);
    }
  };

  const closeDetails = () => {
    if (resolving || updatingStatus) return;

    setSelectedDispute(null);
    setActionError("");
  };

  const vendorName = selectedDispute
    ? getPersonName(
        selectedDispute.vendor,
        selectedDispute.vendor_name || "Vendor / Customer"
      )
    : "";

  const dispatcherName = selectedDispute
    ? getPersonName(
        selectedDispute.dispatcher,
        selectedDispute.dispatcher_name || "Dispatcher"
      )
    : "";

  const vendorPhone =
    selectedDispute?.vendor?.phone ||
    selectedDispute?.vendor_phone ||
    "Not available";

  const vendorEmail =
    selectedDispute?.vendor?.email ||
    selectedDispute?.vendor_email ||
    "Not available";

  const dispatcherPhone =
    selectedDispute?.dispatcher?.phone ||
    selectedDispute?.dispatcher_phone ||
    "Not available";

  const dispatcherEmail =
    selectedDispute?.dispatcher?.email ||
    selectedDispute?.dispatcher_email ||
    "Not available";

  return (
    <div className="admin-disputes-page">
      <div className="admin-disputes-shell">
        {/* HEADER */}
        <header className="admin-disputes-header">
          <div>
            <span className="admin-disputes-eyebrow">
              SHIPORA ADMIN
            </span>

            <h1>Dispute Management</h1>

            <p>
              Review shipment disputes, communicate decisions,
              and resolve payment outcomes securely.
            </p>
          </div>

          <button
            type="button"
            className="admin-disputes-refresh"
            onClick={() => fetchDisputes(true)}
            disabled={refreshing}
          >
            <span className={refreshing ? "refresh-spinning" : ""}>
              ↻
            </span>
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </header>

        {/* ERROR */}
        {error && (
          <div className="admin-disputes-error">
            <strong>Unable to load disputes</strong>
            <span>{error}</span>

            <button
              type="button"
              onClick={() => fetchDisputes()}
            >
              Try again
            </button>
          </div>
        )}

        {/* STATS */}
        <section className="admin-dispute-stats">
          <button
            className={`admin-dispute-stat ${
              filter === "all" ? "active" : ""
            }`}
            onClick={() => setFilter("all")}
          >
            <span>Total disputes</span>
            <strong>{counts.all}</strong>
          </button>

          <button
            className={`admin-dispute-stat ${
              filter === "open" ? "active" : ""
            }`}
            onClick={() => setFilter("open")}
          >
            <span>Open</span>
            <strong>{counts.open}</strong>
          </button>

          <button
            className={`admin-dispute-stat ${
              filter === "under_review" ? "active" : ""
            }`}
            onClick={() => setFilter("under_review")}
          >
            <span>Under review</span>
            <strong>{counts.under_review}</strong>
          </button>

          <button
            className={`admin-dispute-stat ${
              filter === "in_consideration" ? "active" : ""
            }`}
            onClick={() => setFilter("in_consideration")}
          >
            <span>In consideration</span>
            <strong>{counts.in_consideration}</strong>
          </button>

          <button
            className={`admin-dispute-stat ${
              filter === "resolved" ? "active" : ""
            }`}
            onClick={() => setFilter("resolved")}
          >
            <span>Resolved</span>
            <strong>{counts.resolved}</strong>
          </button>
        </section>

        {/* TOOLBAR */}
        <section className="admin-disputes-toolbar">
          <div className="admin-dispute-search">
            <span>⌕</span>

            <input
              type="text"
              placeholder="Search tracking number, dispute, phone..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
              >
                ×
              </button>
            )}
          </div>

          <select
            value={filter}
            onChange={(event) =>
              setFilter(event.target.value)
            }
          >
            <option value="all">All disputes</option>
            <option value="open">Open</option>
            <option value="under_review">
              Under review
            </option>
            <option value="in_consideration">
              In consideration
            </option>
            <option value="resolved">Resolved</option>
          </select>
        </section>

        {/* LIST */}
        <section className="admin-dispute-list">
          {loading ? (
            <div className="admin-disputes-loading">
              <div className="admin-disputes-spinner" />
              <span>Loading disputes...</span>
            </div>
          ) : filteredDisputes.length === 0 ? (
            <div className="admin-disputes-empty">
              <div className="admin-disputes-empty-icon">
                ✓
              </div>

              <h2>No disputes found</h2>

              <p>
                {search || filter !== "all"
                  ? "No disputes match the current filters."
                  : "There are currently no shipment disputes."}
              </p>
            </div>
          ) : (
            filteredDisputes.map((dispute) => {
              const status =
                typeof dispute.status === "string"
                  ? dispute.status.toLowerCase()
                  : dispute.status?.value?.toLowerCase();

              return (
                <button
                  type="button"
                  key={dispute.dispute_id}
                  className="admin-dispute-row"
                  onClick={() =>
                    setSelectedDispute(dispute)
                  }
                >
                  <div className="admin-dispute-row-main">
                    <div className="admin-dispute-id">
                      <span>DISPUTE</span>
                      <strong>
                        {String(dispute.dispute_id).slice(
                          0,
                          8
                        )}
                      </strong>
                    </div>

                    <div className="admin-dispute-tracking">
                      <span>TRACKING NUMBER</span>
                      <strong>
                        {getValue(
                          dispute.tracking_number,
                          "Not available"
                        )}
                      </strong>
                    </div>

                    <div className="admin-dispute-reason">
                      <span>REASON</span>
                      <strong>
                        {getValue(
                          dispute.reason,
                          "Shipment issue"
                        )}
                      </strong>
                    </div>

                    <div
                      className={`admin-dispute-status ${getStatusClass(
                        status
                      )}`}
                    >
                      {formatStatus(status)}
                    </div>

                    <div className="admin-dispute-arrow">
                      →
                    </div>
                  </div>

                  <div className="admin-dispute-row-footer">
                    <span>
                      Created{" "}
                      {formatDate(dispute.created_at)}
                    </span>

                    <span>
                      Shipment{" "}
                      {String(
                        dispute.shipment_id || "—"
                      ).slice(0, 8)}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </section>
      </div>

      {/* DETAILS DRAWER */}
      {selectedDispute && (
        <div
          className="admin-dispute-overlay"
          onClick={closeDetails}
        >
          <aside
            className="admin-dispute-drawer"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="admin-dispute-drawer-header">
              <div>
                <span>DISPUTE DETAILS</span>

                <h2>
                  {getValue(
                    selectedDispute.tracking_number,
                    "Shipment dispute"
                  )}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeDetails}
                className="admin-dispute-close"
              >
                ×
              </button>
            </div>

            <div className="admin-dispute-drawer-content">
              {/* STATUS */}
              <div className="admin-detail-status-line">
                <span
                  className={`admin-dispute-status ${getStatusClass(
                    selectedDispute.status
                  )}`}
                >
                  {formatStatus(
                    selectedDispute.status
                  )}
                </span>

                <span>
                  Created{" "}
                  {formatDate(
                    selectedDispute.created_at
                  )}
                </span>
              </div>

              {/* SHIPMENT */}
              <section className="admin-detail-section">
                <div className="admin-detail-section-title">
                  <span>01</span>
                  <h3>Shipment</h3>
                </div>

                <div className="admin-detail-grid">
                  <div>
                    <span>Tracking number</span>
                    <strong>
                      {getValue(
                        selectedDispute.tracking_number
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Shipment ID</span>
                    <strong className="break-value">
                      {getValue(
                        selectedDispute.shipment_id
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Shipment status</span>
                    <strong>
                      {String(
                        selectedDispute.shipment_status ||
                          "—"
                      )
                        .replaceAll("_", " ")
                        .toUpperCase()}
                    </strong>
                  </div>

                  <div>
                    <span>Payment status</span>
                    <strong>
                      {String(
                        selectedDispute.payment_status ||
                          "—"
                      )
                        .replaceAll("_", " ")
                        .toUpperCase()}
                    </strong>
                  </div>

                  <div>
                    <span>Delivery fee</span>
                    <strong>
                      {formatMoney(
                        selectedDispute.delivery_fee
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Dispute ID</span>
                    <strong className="break-value">
                      {getValue(
                        selectedDispute.dispute_id
                      )}
                    </strong>
                  </div>
                </div>
              </section>

              {/* COMPLAINANT */}
              <section className="admin-detail-section">
                <div className="admin-detail-section-title">
                  <span>02</span>
                  <h3>Vendor / Customer</h3>
                </div>

                <div className="admin-person-card">
                  <div className="admin-person-avatar">
                    {vendorName
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div>
                    <strong>{vendorName}</strong>

                    <span>{vendorPhone}</span>

                    <span>{vendorEmail}</span>
                  </div>
                </div>
              </section>

              {/* DISPATCHER */}
              {selectedDispute.dispatcher_id && (
                <section className="admin-detail-section">
                  <div className="admin-detail-section-title">
                    <span>03</span>
                    <h3>Dispatcher</h3>
                  </div>

                  <div className="admin-person-card">
                    <div className="admin-person-avatar dispatcher">
                      {dispatcherName
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>
                      <strong>
                        {dispatcherName}
                      </strong>

                      <span>
                        {dispatcherPhone}
                      </span>

                      <span>
                        {dispatcherEmail}
                      </span>
                    </div>
                  </div>
                </section>
              )}

              {/* COMPLAINT */}
              <section className="admin-detail-section">
                <div className="admin-detail-section-title">
                  <span>04</span>
                  <h3>Complaint</h3>
                </div>

                <div className="admin-complaint-box">
                  <span>Reason</span>

                  <strong>
                    {getValue(
                      selectedDispute.reason
                    )}
                  </strong>

                  {selectedDispute.description && (
                    <>
                      <span>Description</span>

                      <p>
                        {selectedDispute.description}
                      </p>
                    </>
                  )}
                </div>
              </section>

              {/* EVIDENCE */}
              {Array.isArray(
                selectedDispute.evidence
              ) &&
                selectedDispute.evidence.length > 0 && (
                  <section className="admin-detail-section">
                    <div className="admin-detail-section-title">
                      <span>05</span>
                      <h3>Evidence</h3>
                    </div>

                    <div className="admin-evidence-list">
                      {selectedDispute.evidence.map(
                        (item, index) => {
                          const url =
                            typeof item === "string"
                              ? item
                              : item?.url ||
                                item?.file_url ||
                                item?.path;

                          const name =
                            typeof item === "string"
                              ? `Evidence ${index + 1}`
                              : item?.name ||
                                item?.filename ||
                                `Evidence ${
                                  index + 1
                                }`;

                          return (
                            <div
                              className="admin-evidence-item"
                              key={`${name}-${index}`}
                            >
                              <div>
                                <span>FILE</span>
                                <strong>
                                  {name}
                                </strong>
                              </div>

                              {url && (
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(event) =>
                                    event.stopPropagation()
                                  }
                                >
                                  View
                                </a>
                              )}
                            </div>
                          );
                        }
                      )}
                    </div>
                  </section>
                )}

              {/* RESOLUTION */}
              {selectedDispute.resolution_action && (
                <section className="admin-detail-section">
                  <div className="admin-detail-section-title">
                    <span>06</span>
                    <h3>Resolution</h3>
                  </div>

                  <div className="admin-resolution-box">
                    <span>Action</span>

                    <strong>
                      {formatAction(
                        selectedDispute.resolution_action
                      )}
                    </strong>

                    {selectedDispute.resolution_note && (
                      <>
                        <span>Admin note</span>
                        <p>
                          {
                            selectedDispute.resolution_note
                          }
                        </p>
                      </>
                    )}

                    {selectedDispute.resolved_at && (
                      <>
                        <span>Resolved</span>
                        <p>
                          {formatDate(
                            selectedDispute.resolved_at
                          )}
                        </p>
                      </>
                    )}
                  </div>
                </section>
              )}

              {/* ADMIN CONTROLS */}
              {selectedDispute.status !== "resolved" &&
                selectedDispute.status?.value !==
                  "resolved" && (
                  <section className="admin-detail-actions">
                    <div>
                      <span>ADMIN ACTIONS</span>
                      <h3>Manage this dispute</h3>
                    </div>

                    {actionError && (
                      <div className="admin-action-error">
                        {actionError}
                      </div>
                    )}

                    <div className="admin-status-actions">
                      <button
                        type="button"
                        disabled={updatingStatus}
                        className={
                          selectedDispute.status ===
                            "in_consideration" ||
                          selectedDispute.status?.value ===
                            "in_consideration"
                            ? "selected"
                            : ""
                        }
                        onClick={() =>
                          updateStatus(
                            "in_consideration"
                          )
                        }
                      >
                        IN CONSIDERATION
                      </button>

                      <button
                        type="button"
                        disabled={updatingStatus}
                        className={
                          selectedDispute.status ===
                            "under_review" ||
                          selectedDispute.status?.value ===
                            "under_review"
                            ? "selected"
                            : ""
                        }
                        onClick={() =>
                          updateStatus(
                            "under_review"
                          )
                        }
                      >
                        UNDER REVIEW
                      </button>
                    </div>

                    <button
                      type="button"
                      className="admin-resolve-button"
                      disabled={updatingStatus}
                      onClick={openResolveModal}
                    >
                      Resolve Dispute
                      <span>→</span>
                    </button>
                  </section>
                )}
            </div>
          </aside>
        </div>
      )}

      {/* RESOLUTION MODAL */}
      {showResolveModal && (
        <div
          className="admin-resolution-overlay"
          onClick={() =>
            !resolving &&
            setShowResolveModal(false)
          }
        >
          <div
            className="admin-resolution-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="admin-resolution-modal-header">
              <div>
                <span>FINAL ACTION</span>
                <h2>Resolve dispute</h2>
              </div>

              <button
                type="button"
                disabled={resolving}
                onClick={() =>
                  setShowResolveModal(false)
                }
              >
                ×
              </button>
            </div>

            <p className="admin-resolution-description">
              Choose the payment outcome for this
              shipment. This action will also complete
              the dispute on the backend.
            </p>

            <div className="admin-resolution-options">
              <button
                type="button"
                className={
                  resolutionAction === "release"
                    ? "selected"
                    : ""
                }
                onClick={() =>
                  setResolutionAction("release")
                }
              >
                <strong>Release funds</strong>
                <span>
                  Release the held payment and complete
                  the shipment.
                </span>
              </button>

              <button
                type="button"
                className={
                  resolutionAction === "refund"
                    ? "selected refund"
                    : "refund"
                }
                onClick={() =>
                  setResolutionAction("refund")
                }
              >
                <strong>Refund customer</strong>
                <span>
                  Refund the held payment according to
                  the dispute decision.
                </span>
              </button>
            </div>

            <label className="admin-resolution-note">
              <span>Resolution note</span>

              <textarea
                value={resolutionNote}
                onChange={(event) =>
                  setResolutionNote(
                    event.target.value
                  )
                }
                placeholder="Explain the resolution decision..."
                rows={5}
              />
            </label>

            <div className="admin-resolution-actions">
              <button
                type="button"
                disabled={resolving}
                onClick={() =>
                  setShowResolveModal(false)
                }
                className="admin-resolution-cancel"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={resolving}
                onClick={resolveDispute}
                className="admin-resolution-confirm"
              >
                {resolving
                  ? "Resolving..."
                  : "Confirm Resolution"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}