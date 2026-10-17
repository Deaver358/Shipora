import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../interceptors/api";
import "../index.css";

const STATUS_MESSAGES = {
  open: "Payment received — this shipment is waiting for a dispatcher.",
  assigned: "Payment received — a dispatcher has been assigned.",
  picked_up: "Your package has been picked up.",
  in_transit: "Your package is on its way.",
  out_for_delivery: "Your package is out for delivery.",
  delivered: "Your package has been delivered.",
  completed: "This delivery is complete.",
  disputed: "This delivery is under review.",
  cancelled: "This shipment was cancelled.",
};

function Checkout() {
  // Reached as /checkout/:token or /shipment/:shipmentId (public token)
  const { token: routeToken, shipmentId } = useParams();
  const token = routeToken || shipmentId;

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    region: "",
    postalCode: "",
  });

  const [shipmentData, setShipmentData] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const { data } = await api.get(
          `shipments/public/${encodeURIComponent(token)}`
        );

        if (cancelled) return;

        setShipmentData(data);
        setForm((previous) => ({
          ...previous,
          name: data.recipient_name || "",
          phone: data.recipient_phone || "",
          address: data.recipient_address || "",
          city: data.recipient_city || "",
          region: data.recipient_region || "",
          postalCode: data.recipient_postal_code || "",
        }));
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.response?.data?.detail ||
              "We couldn't find this shipment link."
          );
        }
      } finally {
        if (!cancelled) setPageLoading(false);
      }
    };

    if (token) {
      load();
    } else {
      setPageLoading(false);
      setError("This checkout link is incomplete.");
    }

    return () => {
      cancelled = true;
    };
  }, [token]);

  const shipment = {
    packageName: shipmentData?.item_name || "Shipment Package",
    description:
      shipmentData?.description ||
      (shipmentData
        ? `${shipmentData.pickup} → ${shipmentData.destination}`
        : "Package details will appear here."),
    // the API returns kobo
    deliveryFee: Number(shipmentData?.delivery_fee || 0) / 100,
    serviceFee: Number(shipmentData?.service_fee || 0) / 100,
    currency: "₦",
  };

  const total =
    Number(shipment.deliveryFee) +
    Number(shipment.serviceFee);

  const awaitingPayment = shipmentData?.status === "pending_payment";
  const customerPays = shipmentData?.payment_by === "customer";
  const locked =
    !shipmentData ||
    ["completed", "cancelled"].includes(shipmentData.status);

  const updateField = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading || locked) return;

    setLoading(true);
    setError("");
    setNotice("");

    try {
      const { data: saved } = await api.post(
        `shipments/public/${encodeURIComponent(token)}/checkout`,
        {
          recipient_name: form.name.trim(),
          recipient_phone: form.phone.trim(),
          recipient_address: form.address.trim(),
          recipient_city: form.city.trim() || null,
          recipient_region: form.region.trim() || null,
          recipient_postal_code: form.postalCode.trim() || null,
        }
      );

      setShipmentData(saved);

      if (!(awaitingPayment && customerPays)) {
        setNotice("Your delivery details have been saved.");
        setLoading(false);
        return;
      }

      const { data } = await api.post(
        `shipments/public/${encodeURIComponent(token)}/pay`,
        null,
        { params: { email: form.email.trim() } }
      );

      if (!data?.authorization_url) {
        throw new Error("Payment checkout could not be created. Please try again.");
      }

      window.location.href = data.authorization_url;
    } catch (err) {
      const detail = err?.response?.data?.detail;

      setError(
        Array.isArray(detail)
          ? detail.map((item) => item?.msg || "Invalid field").join(", ")
          : detail || err.message || "Something went wrong. Please try again."
      );
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <main className="checkout-page">
        <section className="checkout-container">
          <div className="checkout-header">
            <span className="page-eyebrow">SHIPORA CHECKOUT</span>
            <h1>Loading shipment…</h1>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="checkout-page">

      <section className="checkout-container">

        <div className="checkout-header">
          <span className="page-eyebrow">
            SHIPORA CHECKOUT
          </span>

          <h1>Complete your shipment</h1>

          <p>
            {shipmentData && !awaitingPayment
              ? STATUS_MESSAGES[shipmentData.status] ||
                "This shipment is being processed."
              : "Enter your delivery information before continuing to payment."}
          </p>

          {shipmentData?.tracking_number && (
            <p>
              Tracking number: <strong>{shipmentData.tracking_number}</strong>
            </p>
          )}
        </div>

        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}

        {notice && (
          <div className="auth-success" role="status">
            {notice}
          </div>
        )}

        <div className="checkout-grid">

          <form
            className="checkout-form-card"
            onSubmit={handleSubmit}
          >

            <div className="checkout-section-title">
              <span>01</span>
              <div>
                <h2>Delivery information</h2>
                <p>Where should your shipment be delivered?</p>
              </div>
            </div>

            <div className="checkout-fields">

              <div className="form-field">
                <label>Full Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={updateField}
                  placeholder="Enter your full name"
                  required
                  disabled={locked}
                />
              </div>

              <div className="form-field">
                <label>Phone Number</label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={updateField}
                  placeholder="Enter phone number"
                  required
                  disabled={locked}
                />
              </div>

              {awaitingPayment && customerPays && (
                <div className="form-field full-width">
                  <label>Email (for your payment receipt)</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={updateField}
                    placeholder="you@example.com"
                    required
                  />
                </div>
              )}

              <div className="form-field full-width">
                <label>Delivery Address</label>
                <input
                  name="address"
                  value={form.address}
                  onChange={updateField}
                  placeholder="Street address"
                  required
                  disabled={locked}
                />
              </div>

              <div className="form-field">
                <label>City</label>
                <input
                  name="city"
                  value={form.city}
                  onChange={updateField}
                  placeholder="City"
                  required
                  disabled={locked}
                />
              </div>

              <div className="form-field">
                <label>State / Region</label>
                <input
                  name="region"
                  value={form.region}
                  onChange={updateField}
                  placeholder="State or region"
                  required
                  disabled={locked}
                />
              </div>

              <div className="form-field">
                <label>Postal Code</label>
                <input
                  name="postalCode"
                  value={form.postalCode}
                  onChange={updateField}
                  placeholder="Optional"
                  disabled={locked}
                />
              </div>

            </div>

            <button
              type="submit"
              className="full-primary-button"
              disabled={loading || locked}
            >
              {loading
                ? "Preparing payment..."
                : awaitingPayment && customerPays
                  ? "Continue to Payment"
                  : "Save Delivery Details"}
              <span>→</span>
            </button>

          </form>

          <aside className="checkout-summary">

            <span className="page-eyebrow">
              SHIPMENT SUMMARY
            </span>

            <div className="checkout-package">
              <div className="package-image">
                📦
              </div>

              <div>
                <strong>{shipment.packageName}</strong>
                <p>{shipment.description}</p>
              </div>
            </div>

            <div className="summary-lines">

              <div>
                <span>Delivery fee</span>
                <strong>
                  {shipment.currency}
                  {shipment.deliveryFee.toLocaleString()}
                </strong>
              </div>

              <div>
                <span>Service fee</span>
                <strong>
                  {shipment.currency}
                  {shipment.serviceFee.toLocaleString()}
                </strong>
              </div>

              <div className="summary-total">
                <span>Total</span>
                <strong>
                  {shipment.currency}
                  {total.toLocaleString()}
                </strong>
              </div>

            </div>

            <div className="checkout-security">
              <span>✓</span>
              <p>
                Your payment is processed securely.
              </p>
            </div>

          </aside>

        </div>

      </section>
    </main>
  );
}

export default Checkout;
