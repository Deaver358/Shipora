import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../index.css";

function Checkout() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    region: "",
    postalCode: "",
  });

  const [loading, setLoading] = useState(false);

  const shipment = {
    packageName: "Shipment Package",
    description: "Package details will appear here.",
    deliveryFee: 0,
    serviceFee: 0,
    currency: "₦",
  };

  const total =
    Number(shipment.deliveryFee) +
    Number(shipment.serviceFee);

  const updateField = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      navigate(`/payment-result?token=${token}`);
    }, 600);
  };

  return (
    <main className="checkout-page">

      <section className="checkout-container">

        <div className="checkout-header">
          <span className="page-eyebrow">
            SHIPORA CHECKOUT
          </span>

          <h1>Complete your shipment</h1>

          <p>
            Enter your delivery information before continuing
            to payment.
          </p>
        </div>

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
                />
              </div>

              <div className="form-field full-width">
                <label>Delivery Address</label>
                <input
                  name="address"
                  value={form.address}
                  onChange={updateField}
                  placeholder="Street address"
                  required
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
                />
              </div>

              <div className="form-field">
                <label>Postal Code</label>
                <input
                  name="postalCode"
                  value={form.postalCode}
                  onChange={updateField}
                  placeholder="Optional"
                />
              </div>

            </div>

            <button
              type="submit"
              className="full-primary-button"
              disabled={loading}
            >
              {loading
                ? "Preparing payment..."
                : "Continue to Payment"}
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