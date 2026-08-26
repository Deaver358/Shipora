import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../index.css";

function CreateShipment() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    itemName: "",
    description: "",
    media: [],
    pickup: "",
    destination: "",
    recipientName: "",
    recipientPhone: "",
    paymentBy: "vendor",
    deliveryAmount: "",
    note: "",
  });

  const [showSummary, setShowSummary] = useState(false);

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setShowSummary(true);
  };

  const confirmShipment = () => {
    console.log("Shipment created:", form);

    // Backend/payment integration will be connected later.
    setShowSummary(false);
    navigate("/Myshipments");
  };

  return (
    <div className="create-shipment-page">
      <button
        type="button"
        className="white-page-back-button"
        onClick={() => navigate(-1)}
        aria-label="Go back"
      >
        ←
      </button>

      <br />

      {/* ================= HEADER ================= */}

      <header className="create-shipment-header">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-dot"></span>
            CREATE SHIPMENT
          </div>

          <h1>
            Send it with
            <span>Shipora.</span>
          </h1>

          <p>
            Create your shipment, provide the delivery details and
            choose who will cover the delivery cost. Once accepted,
            Shipora keeps the delivery arrangement clear from
            dispatch to destination.
          </p>
        </div>
      </header>

      {/* ================= FORM ================= */}

      <main className="create-shipment-content">
        <form
          className="shipment-form-card"
          onSubmit={handleSubmit}
        >
          {/* ================= ITEM ================= */}

          <section className="shipment-form-section">
            <div className="shipment-section-heading">
              <span>01</span>

              <div>
                <h2>What are you sending?</h2>

                <p>
                  Give the dispatch enough information to identify
                  and handle the shipment properly.
                </p>
              </div>
            </div>

            <div className="shipment-form-grid">
              <label>
                Item Name

                <input
                  type="text"
                  placeholder="e.g. Electronics"
                  value={form.itemName}
                  onChange={(event) =>
                    updateField("itemName", event.target.value)
                  }
                  required
                />
              </label>

              <label>
                Item Description

                <input
                  type="text"
                  placeholder="e.g. Laptop in sealed package"
                  value={form.description}
                  onChange={(event) =>
                    updateField("description", event.target.value)
                  }
                  required
                />
              </label>
            </div>

            {/* ================= ITEM MEDIA ================= */}

            <div className="shipment-media-upload">
              <div className="shipment-media-heading">
                <div>
                  <span className="shipment-media-label">
                    ITEM MEDIA
                  </span>

                  <h3>
                    Add photos or a short video
                  </h3>

                  <p>
                    Upload clear images or a short video of the item
                    so the dispatch can identify the package before
                    handling it.
                  </p>
                </div>
              </div>

              <label
                htmlFor="shipment-media"
                className="shipment-media-dropzone"
              >
                <input
                  id="shipment-media"
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={(event) => {
                    const selectedFiles = Array.from(
                      event.target.files || []
                    );

                    if (selectedFiles.length > 3) {
                      alert(
                        "You can upload a maximum of 3 files."
                      );
                      event.target.value = "";
                      return;
                    }

                    updateField("media", selectedFiles);
                  }}
                  required
                />

                <div className="shipment-upload-icon">
                  +
                </div>

                <div className="shipment-media-upload-text">
                  <strong>
                    Upload item photos or video
                  </strong>

                  <span>
                    Up to 3 files · JPG, PNG, WEBP or MP4
                  </span>
                </div>
              </label>

              {/* ================= MEDIA PREVIEW ================= */}

              {form.media?.length > 0 && (
                <div className="shipment-media-preview">
                  {form.media.map((file, index) => {
                    const previewUrl =
                      URL.createObjectURL(file);

                    const isVideo =
                      file.type.startsWith("video/");

                    return (
                      <div
                        className="shipment-media-preview-card"
                        key={`${file.name}-${index}`}
                      >
                        {isVideo ? (
                          <video
                            src={previewUrl}
                            controls
                            muted
                          />
                        ) : (
                          <img
                            src={previewUrl}
                            alt={`Shipment item ${index + 1}`}
                          />
                        )}

                        <button
                          type="button"
                          className="shipment-media-remove"
                          onClick={() => {
                            const updatedMedia =
                              form.media.filter(
                                (_, mediaIndex) =>
                                  mediaIndex !== index
                              );

                            updateField(
                              "media",
                              updatedMedia
                            );
                          }}
                          aria-label={`Remove ${file.name}`}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* ================= ROUTE ================= */}

          <section className="shipment-form-section">
            <div className="shipment-section-heading">
              <span>02</span>

              <div>
                <h2>Where is it going?</h2>

                <p>
                  Enter the pickup and delivery locations
                  for this shipment.
                </p>
              </div>
            </div>

            <div className="shipment-route-fields">
              <label>
                Pickup Location

                <input
                  type="text"
                  placeholder="Full pickup address"
                  value={form.pickup}
                  onChange={(event) =>
                    updateField(
                      "pickup",
                      event.target.value
                    )
                  }
                  required
                />
              </label>

              <div className="shipment-route-arrow">
                ↓
              </div>

              <label>
                Delivery Destination

                <input
                  type="text"
                  placeholder="Full delivery address"
                  value={form.destination}
                  onChange={(event) =>
                    updateField(
                      "destination",
                      event.target.value
                    )
                  }
                  required
                />
              </label>
            </div>
          </section>

          {/* ================= RECIPIENT ================= */}

          <section className="shipment-form-section">
            <div className="shipment-section-heading">
              <span>03</span>

              <div>
                <h2>Who will receive it?</h2>

                <p>
                  Provide the recipient information needed
                  for delivery.
                </p>
              </div>
            </div>

            <div className="shipment-form-grid">
              <label>
                Recipient Name

                <input
                  type="text"
                  placeholder="Full name"
                  value={form.recipientName}
                  onChange={(event) =>
                    updateField(
                      "recipientName",
                      event.target.value
                    )
                  }
                  required
                />
              </label>

              <label>
                Recipient Phone

                <input
                  type="tel"
                  placeholder="080XXXXXXXX"
                  value={form.recipientPhone}
                  onChange={(event) =>
                    updateField(
                      "recipientPhone",
                      event.target.value
                    )
                  }
                  required
                />
              </label>
            </div>
          </section>

          {/* ================= PAYMENT ================= */}

          <section className="shipment-form-section">
            <div className="shipment-section-heading">
              <span>04</span>

              <div>
                <h2>Who pays for delivery?</h2>

                <p>
                  The delivery fee can be covered by you or
                  arranged for the recipient to pay.
                </p>
              </div>
            </div>

            <div className="payment-choice-grid">
              <button
                type="button"
                className={`payment-choice ${
                  form.paymentBy === "vendor"
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  updateField(
                    "paymentBy",
                    "vendor"
                  )
                }
              >
                <span className="payment-choice-icon">
                  ₦
                </span>

                <div>
                  <strong>I will pay</strong>

                  <p>
                    You cover the delivery cost when
                    creating the shipment.
                  </p>
                </div>

                <span className="payment-choice-check">
                  {form.paymentBy === "vendor"
                    ? "✓"
                    : ""}
                </span>
              </button>

              <button
                type="button"
                className={`payment-choice ${
                  form.paymentBy === "recipient"
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  updateField(
                    "paymentBy",
                    "recipient"
                  )
                }
              >
                <span className="payment-choice-icon">
                  →
                </span>

                <div>
                  <strong>Recipient will pay</strong>

                  <p>
                    The recipient covers the agreed
                    delivery amount upon delivery
                    arrangement.
                  </p>
                </div>

                <span className="payment-choice-check">
                  {form.paymentBy === "recipient"
                    ? "✓"
                    : ""}
                </span>
              </button>
            </div>

            <label className="shipment-full-field">
              Delivery Amount

              <div className="amount-input">
                <span>₦</span>

                <input
                  type="number"
                  min="0"
                  placeholder="5,000"
                  value={form.deliveryAmount}
                  onChange={(event) =>
                    updateField(
                      "deliveryAmount",
                      event.target.value
                    )
                  }
                  required
                />
              </div>
            </label>

            <div className="held-payment-note">
              <div className="held-payment-icon">
                ₦
              </div>

              <div>
                <strong>
                  Payment protection
                </strong>

                <p>
                  When payment is made through Shipora,
                  the delivery amount is held for delivery
                  and released according to the shipment's
                  completion and dispute status.
                </p>
              </div>
            </div>
          </section>

          {/* ================= NOTE ================= */}

          <section className="shipment-form-section">
            <div className="shipment-section-heading">
              <span>05</span>

              <div>
                <h2>
                  Anything the dispatch should know?
                </h2>

                <p>
                  Add optional instructions or handling
                  information.
                </p>
              </div>
            </div>

            <label className="shipment-full-field">
              Shipment Note

              <textarea
                placeholder="Add delivery instructions, handling information or other useful details..."
                value={form.note}
                onChange={(event) =>
                  updateField(
                    "note",
                    event.target.value
                  )
                }
              />
            </label>
          </section>

          {/* ================= ACTIONS ================= */}

          <div className="create-shipment-actions">
            <button
              type="button"
              className="shipment-cancel-button"
              onClick={() => navigate("/Vendor")}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="shipment-submit-button"
            >
              Review Shipment
              <span>→</span>
            </button>
          </div>
        </form>
      </main>

      {/* ================= REVIEW MODAL ================= */}

      {showSummary && (
        <div
          className="shipment-review-overlay"
          onClick={() => setShowSummary(false)}
        >
          <div
            className="shipment-review-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="shipment-review-header">
              <div>
                <span>SHIPMENT REVIEW</span>

                <h2>
                  Ready to create?
                </h2>
              </div>

              <button
                type="button"
                className="shipment-modal-close"
                onClick={() =>
                  setShowSummary(false)
                }
              >
                ×
              </button>
            </div>

            <div className="shipment-review-route">
              <div>
                <small>PICKUP</small>

                <strong>
                  {form.pickup}
                </strong>
              </div>

              <span>→</span>

              <div>
                <small>DESTINATION</small>

                <strong>
                  {form.destination}
                </strong>
              </div>
            </div>

            <div className="shipment-review-details">
              <div>
                <span>ITEM</span>

                <strong>
                  {form.itemName}
                </strong>
              </div>

              <div>
                <span>RECIPIENT</span>

                <strong>
                  {form.recipientName}
                </strong>
              </div>

              <div>
                <span>DELIVERY FEE</span>

                <strong>
                  ₦
                  {Number(
                    form.deliveryAmount || 0
                  ).toLocaleString()}
                </strong>
              </div>

              <div>
                <span>PAYMENT</span>

                <strong>
                  {form.paymentBy === "vendor"
                    ? "Vendor pays"
                    : "Recipient pays"}
                </strong>
              </div>
            </div>

            <div className="shipment-review-note">
              <strong>
                What happens next?
              </strong>

              <p>
                Your shipment will be created and made
                available for dispatch matching. Once a
                dispatch accepts the shipment, the delivery
                process can begin.
              </p>
            </div>

            <div className="shipment-review-actions">
              <button
                type="button"
                className="shipment-cancel-button"
                onClick={() =>
                  setShowSummary(false)
                }
              >
                Edit Shipment
              </button>

              <button
                type="button"
                className="shipment-submit-button"
                onClick={confirmShipment}
              >
                Create Shipment
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= BOTTOM NAVIGATION ================= */}

      <nav className="bottom-nav">
        <button
          className="bottom-nav-item"
          onClick={() =>
            navigate("/Home")
          }
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
          >
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
          className="bottom-nav-item active"
          onClick={() =>
            navigate("/shipments")
          }
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
          >
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
          className="bottom-nav-item"
          onClick={() =>
            navigate("/tracking")
          }
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
          >
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
          className="bottom-nav-item"
          onClick={() =>
            navigate("/dashboard")
          }
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
          >
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

export default CreateShipment;