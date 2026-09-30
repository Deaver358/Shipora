import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../interceptors/api";
import "../index.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1.0";

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
    vehiclePreference: "",
    note: "",
  });

  const [previewUrls, setPreviewUrls] = useState([]);
  const [showSummary, setShowSummary] = useState(false);
  const [creating, setCreating] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [createdShipment, setCreatedShipment] = useState(null);

  useEffect(() => {
    const urls = form.media.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      isVideo: file.type.startsWith("video/"),
    }));

    setPreviewUrls(urls);

    return () => {
      urls.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [form.media]);

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleMediaChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);

    if (!selectedFiles.length) return;

    if (selectedFiles.length > 3) {
      alert("You can upload a maximum of 3 files.");
      event.target.value = "";
      return;
    }

    const invalidFile = selectedFiles.find(
      (file) =>
        !file.type.startsWith("image/") &&
        !file.type.startsWith("video/")
    );

    if (invalidFile) {
      alert("Only images and videos are allowed.");
      event.target.value = "";
      return;
    }

    updateField("media", selectedFiles);
  };

  const removeMedia = (index) => {
    updateField(
      "media",
      form.media.filter((_, mediaIndex) => mediaIndex !== index)
    );
  };

  const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(reader.result);
      reader.onerror = () =>
        reject(new Error(`Could not read ${file.name}.`));

      reader.readAsDataURL(file);
    });

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");
    setShowSummary(true);
  };

const createAndPayShipment = async () => {
  setError("");
  setCreating(true);

  try {
    if (form.paymentBy !== "vendor") {
      throw new Error("The vendor must pay for the shipment.");
    }

    if (!form.media.length) {
      throw new Error("Please upload at least one shipment image.");
    }

    const media = await Promise.all(
      form.media.map((file) => fileToDataUrl(file))
    );

    const createPayload = {
      item_name: form.itemName.trim(),
      description: form.description.trim(),
      media,
      pickup: form.pickup.trim(),
      destination: form.destination.trim(),
      recipient_name: form.recipientName.trim(),
      recipient_phone: form.recipientPhone.trim(),
      vehicle_preference: form.vehiclePreference,
      note: form.note.trim() || null,
      payment_by: "vendor",
      delivery_amount: Number(form.deliveryAmount),
    };

    // 1. CREATE SHIPMENT
    const { data: createdShipment } = await api.post(
      "shipments",
      createPayload
    );

    setCreatedShipment(createdShipment);

    // 2. CHARGE SHIPORA WALLET
    setCreating(false);
    setPaying(true);

    const { data: paidShipment } = await api.post(
      `shipments/${createdShipment.shipment_id}/pay`
    );

    // 3. PAYMENT SUCCESSFUL
    setShowSummary(false);

    navigate("/MyShipments", {
      state: {
        shipment: paidShipment,
        paymentSuccessful: true,
      },
    });
  } catch (err) {
    console.error("Create/payment error:", err);

    const message =
      err?.response?.data?.detail ||
      err?.response?.data?.message ||
      err?.message ||
      "Something went wrong. Please try again.";

    const finalMessage = Array.isArray(message)
      ? message.map((item) => item.msg).join(", ")
      : message;

    setError(finalMessage);

    // If wallet/payment failed, keep the review modal open.
    setShowSummary(true);
  } finally {
    setCreating(false);
    setPaying(false);
  }
};

  const isProcessing = creating || paying;

  const deliveryFee = Number(form.deliveryAmount || 0);
  const serviceFee = Math.round(deliveryFee * 0.03);
  const vendorTotal = deliveryFee + serviceFee;

  return (
    <div className="create-shipment-page">
      <button
        type="button"
        className="white-page-back-button"
        onClick={() => navigate(-1)}
        aria-label="Go back"
      >
        ←
      </button> <br />

      <header className="create-shipment-header">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-dot"></span>
            CREATE SHIPMENT
          </div>

          <h1>
            Send it with <span>Shipora.</span>
          </h1>

          <p>
            Create your shipment, provide the delivery details
            and choose the vehicle that best fits your package.
            Your payment is held securely until delivery is
            completed.
          </p>
        </div>
      </header>

      <main className="create-shipment-content">
        <form
          className="shipment-form-card"
          onSubmit={handleSubmit}
        >
          {/* ITEM */}
          <section className="shipment-form-section">
            <div className="shipment-section-heading">
              <span>01</span>

              <div>
                <h2>What are you sending?</h2>

                <p>
                  Give the dispatcher enough information to
                  identify and handle the shipment properly.
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
                    updateField(
                      "itemName",
                      event.target.value
                    )
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
                    updateField(
                      "description",
                      event.target.value
                    )
                  }
                  required
                />
              </label>
            </div>

            <div className="shipment-media-upload">
              <div className="shipment-media-heading">
                <div>
                  <span className="shipment-media-label">
                    ITEM MEDIA
                  </span>

                  <h3>Add photos or a short video</h3>

                  <p>
                    At least one image is required. Clear
                    media helps the dispatcher identify the
                    package before handling it.
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
                  onChange={handleMediaChange}
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

              {previewUrls.length > 0 && (
                <div className="shipment-media-preview">
                  {previewUrls.map((item, index) => (
                    <div
                      className="shipment-media-preview-card"
                      key={`${item.file.name}-${index}`}
                    >
                      {item.isVideo ? (
                        <video
                          src={item.url}
                          controls
                          muted
                        />
                      ) : (
                        <img
                          src={item.url}
                          alt={`Shipment item ${index + 1}`}
                        />
                      )}

                      <button
                        type="button"
                        className="shipment-media-remove"
                        onClick={() =>
                          removeMedia(index)
                        }
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* ROUTE */}
          <section className="shipment-form-section">
            <div className="shipment-section-heading">
              <span>02</span>

              <div>
                <h2>Where is it going?</h2>

                <p>
                  Enter the pickup and delivery locations.
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

          {/* RECIPIENT */}
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

          {/* DELIVERY */}
          <section className="shipment-form-section">
            <div className="shipment-section-heading">
              <span>04</span>

              <div>
                <h2>Delivery preferences</h2>

                <p>
                  Help us match your shipment with a suitable
                  dispatcher and vehicle.
                </p>
              </div>
            </div>

            <label className="shipment-full-field">
              Preferred Vehicle

              <div className="amount-input">
                <select
                  value={form.vehiclePreference}
                  onChange={(event) =>
                    updateField(
                      "vehiclePreference",
                      event.target.value
                    )
                  }
                  required
                >
                  <option value="">
                    Select a vehicle
                  </option>
                  <option value="Motorcycle">
                    Motorcycle
                  </option>
                  <option value="Car">Car</option>
                  <option value="Van">Van</option>
                  <option value="Truck">Truck</option>
                  <option value="Bicycle">
                    Bicycle
                  </option>
                </select>
              </div>
            </label>

            <label className="shipment-full-field">
              Delivery Amount

              <div className="amount-input">
                <span>₦</span>

                <input
                  type="number"
                  min="1"
                  step="1"
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

            <div className="shipment-charge-summary">
  <div className="shipment-charge-summary-header">
    <div className="shipment-charge-icon">₦</div>

    <div>
      <span>DELIVERY CHARGES</span>
      <strong>Your shipment cost</strong>
    </div>
  </div>

  <div className="shipment-charge-row">
    <span>Delivery fee</span>
    <strong>
      ₦{deliveryFee.toLocaleString()}
    </strong>
  </div>

  <div className="shipment-charge-row">
    <span>Shipora service fee</span>
    <strong>
      ₦{serviceFee.toLocaleString()}
    </strong>
  </div>

  <div className="shipment-charge-divider"></div>

  <div className="shipment-charge-total">
    <span>Total charge</span>
    <strong>
      ₦{vendorTotal.toLocaleString()}
    </strong>
  </div>

  <p className="shipment-charge-note">
    Your total charge covers the delivery service and Shipora
    service fee. Payment is securely held until the delivery
    process is completed.
  </p>
</div>
          </section>

          {/* NOTE */}
          <section className="shipment-form-section">
            <div className="shipment-section-heading">
              <span>05</span>

              <div>
                <h2>
                  Anything the dispatcher should know?
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

          {error && (
            <div className="shipment-form-error">
              <strong>Payment could not be completed</strong>
              <span>{error}</span>
            </div>
          )}

          <div className="create-shipment-actions">
            <button
              type="button"
              className="shipment-cancel-button"
              onClick={() => navigate("/Vendor")}
              disabled={isProcessing}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="shipment-submit-button"
              disabled={isProcessing}
            >
              Review Shipment
              <span>→</span>
            </button>
          </div>
        </form>
      </main>

      {/* REVIEW MODAL */}
      {showSummary && (
        <div
          className="shipment-review-overlay"
          onClick={() =>
            !isProcessing && setShowSummary(false)
          }
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

                <h2>Ready to pay?</h2>
              </div>

              <button
                type="button"
                className="shipment-modal-close"
                onClick={() =>
                  !isProcessing &&
                  setShowSummary(false)
                }
                disabled={isProcessing}
              >
                ×
              </button>
            </div>

            <div className="shipment-review-route">
              <div>
                <small>PICKUP</small>

                <strong>{form.pickup}</strong>
              </div>

              <span>→</span>

              <div>
                <small>DESTINATION</small>

                <strong>{form.destination}</strong>
              </div>
            </div>

            <div className="shipment-review-details">
              <div>
                <span>ITEM</span>
                <strong>{form.itemName}</strong>
              </div>

              <div>
                <span>RECIPIENT</span>
                <strong>{form.recipientName}</strong>
              </div>

              <div>
                <span>DELIVERY FEE</span>
                <strong>
                  ₦{deliveryFee.toLocaleString()}
                </strong>
              </div>

              <div>
                <span>SERVICE FEE</span>
                <strong>
                  ₦{serviceFee.toLocaleString()}
                </strong>
              </div>

              <div className="shipment-review-total">
                <span>VENDOR TOTAL</span>
                <strong>
                  ₦{vendorTotal.toLocaleString()}
                </strong>
              </div>

              <div>
                <span>PAYMENT</span>
                <strong>Vendor pays</strong>
              </div>
            </div>

            <div className="shipment-review-note">
              <strong>Payment protection</strong>

              <p>
                Your payment is taken from your Shipora
                wallet and held for the shipment. The
                dispatcher is paid after successful delivery,
                confirmation, or automatic release.
              </p>
            </div>

            {error && (
              <div className="shipment-form-error modal-error">
                <strong>Payment failed</strong>
                <span>{error}</span>

                <button
                  type="button"
                  onClick={() => navigate("/top-up")}
                >
                  Top Up Wallet
                </button>
              </div>
            )}

            <div className="shipment-review-actions">
              <button
                type="button"
                className="shipment-cancel-button"
                onClick={() =>
                  !isProcessing &&
                  setShowSummary(false)
                }
                disabled={isProcessing}
              >
                Edit Shipment
              </button>

              <button
                type="button"
                className="shipment-submit-button"
                onClick={createAndPayShipment}
                disabled={isProcessing}
              >
                {creating
                  ? "Creating..."
                  : paying
                  ? "Processing Payment..."
                  : "Proceed to Payment"}

                {!isProcessing && <span>→</span>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM NAVIGATION */}
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

export default CreateShipment;