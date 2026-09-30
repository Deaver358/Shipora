import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthStatusModal from "../components/AuthStatusModal";
import "../index.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1.0";

function VerifyDispatch() {
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    surname: "",
    dateOfBirth: "",
    phone: "",
    email: "",
    nationality: "Nigerian",
    state: "",
    lga: "",
    address: "",
    nin: "",

    dispatchName: "",
    operatingState: "",
    operatingCity: "",
    vehicleType: "",
    vehicleRegistration: "",
    isDriver: "",
    licenceNumber: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setSubmitting(true);
    setError("");

    const payload = {
      first_name: formData.firstName.trim(),
      middle_name: formData.middleName.trim(),
      surname: formData.surname.trim(),
      date_of_birth: formData.dateOfBirth,
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      nationality: formData.nationality.trim(),
      state: formData.state.trim(),
      lga: formData.lga.trim(),
      address: formData.address.trim(),
      nin: formData.nin.trim(),

      dispatch_name: formData.dispatchName.trim(),
      operating_state: formData.operatingState.trim(),
      operating_city: formData.operatingCity.trim(),
      vehicle_type: formData.vehicleType,
      vehicle_registration: formData.vehicleRegistration.trim(),
      is_driver: formData.isDriver,
      licence_number: formData.licenceNumber.trim(),
    };

    try {
      const response = await fetch(`${API_BASE_URL}/dispatcher/verify`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      let responseData = null;

      try {
        responseData = await response.json();
      } catch {
        responseData = null;
      }

      if (!response.ok) {
        let message = "Verification could not be submitted.";

        if (responseData?.detail) {
          if (typeof responseData.detail === "string") {
            message = responseData.detail;
          } else if (Array.isArray(responseData.detail)) {
            message = responseData.detail
              .map((item) => item?.msg || "Invalid field")
              .join(", ");
          }
        }

        throw new Error(message);
      }

      setShowModal(true);
    } catch (submitError) {
      setError(
        submitError?.message ||
          "Something went wrong while submitting your verification."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    navigate("/shipments");
  };

  return (
    <main className="verification-page">
      <section className="verification-shell">
        <div className="verification-top">
          <button
            type="button"
            className="verification-back-link"
            onClick={() => navigate("/verify-role")}
            disabled={submitting}
          >
            ← Back
          </button>

          <div className="verification-eyebrow">
            <span></span>
            DISPATCHER VERIFICATION
          </div>
        </div>

        <div className="verification-header">
          <h1>Verify your dispatch account.</h1>

          <p>
            Complete your identity and vehicle information to request access
            to Shipora&apos;s dispatch features.
          </p>
        </div>

        <div className="verification-progress">
          <div className="verification-progress-item active">
            <span>01</span>
            <p>Personal Identity</p>
          </div>

          <div className="verification-progress-line"></div>

          <div className="verification-progress-item">
            <span>02</span>
            <p>Vehicle Details</p>
          </div>

          <div className="verification-progress-line"></div>

          <div className="verification-progress-item">
            <span>03</span>
            <p>Review &amp; Submit</p>
          </div>
        </div>

        {error && (
          <div className="verification-error" role="alert">
            {error}
          </div>
        )}

        <form className="verification-form" onSubmit={handleSubmit}>
          {/* PERSONAL IDENTITY */}
          <section className="verification-section">
            <div className="verification-section-heading">
              <div className="verification-section-number">01</div>

              <div>
                <span>PERSONAL IDENTITY</span>

                <h2>Verify your identity once.</h2>

                <p>
                  Your identity information is required before you can access
                  Shipora&apos;s Dispatcher Workspace.
                </p>
              </div>
            </div>

            <div className="verification-grid">
              <div className="verification-field">
                <label>Legal First Name</label>

                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Enter your first name"
                  required
                />
              </div>

              <div className="verification-field">
                <label>
                  Middle Name
                  <small>Optional</small>
                </label>

                <input
                  type="text"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleChange}
                  placeholder="Enter your middle name"
                />
              </div>

              <div className="verification-field">
                <label>Legal Surname</label>

                <input
                  type="text"
                  name="surname"
                  value={formData.surname}
                  onChange={handleChange}
                  placeholder="Enter your surname"
                  required
                />
              </div>

              <div className="verification-field">
                <label>Date of Birth</label>

                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="verification-field">
                <label>Phone Number</label>

                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+234 800 000 0000"
                  required
                />
              </div>

              <div className="verification-field">
                <label>Email Address</label>

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="verification-field">
                <label>Nationality</label>

                <input
                  type="text"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="verification-field">
                <label>State of Residence</label>

                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="e.g. Lagos"
                  required
                />
              </div>

              <div className="verification-field">
                <label>Local Government Area</label>

                <input
                  type="text"
                  name="lga"
                  value={formData.lga}
                  onChange={handleChange}
                  placeholder="Enter your LGA"
                  required
                />
              </div>

              <div className="verification-field verification-field-full">
                <label>Residential Address</label>

                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter your residential address"
                  required
                />
              </div>

              <div className="verification-field verification-field-full">
                <label>
                  National Identification Number
                  <small>Private</small>
                </label>

                <input
                  type="password"
                  name="nin"
                  value={formData.nin}
                  onChange={handleChange}
                  placeholder="Enter your NIN"
                  inputMode="numeric"
                  required
                />

                <p className="verification-field-note">
                  Your NIN is used only for verification. Never share it
                  publicly.
                </p>
              </div>
            </div>
          </section>

          {/* DISPATCH INFORMATION */}
          <section className="verification-section">
            <div className="verification-section-heading">
              <div className="verification-section-number">02</div>

              <div>
                <span>DISPATCH VERIFICATION</span>

                <h2>Tell us about your delivery operation.</h2>

                <p>
                  Provide the information required to create your Dispatcher
                  profile and begin vehicle verification.
                </p>
              </div>
            </div>

            <div className="verification-grid">
              <div className="verification-field verification-field-full">
                <label>Dispatch / Business Name</label>

                <input
                  type="text"
                  name="dispatchName"
                  value={formData.dispatchName}
                  onChange={handleChange}
                  placeholder="Enter your dispatch or business name"
                  required
                />
              </div>

              <div className="verification-field">
                <label>Operating State</label>

                <input
                  type="text"
                  name="operatingState"
                  value={formData.operatingState}
                  onChange={handleChange}
                  placeholder="e.g. Lagos"
                  required
                />
              </div>

              <div className="verification-field">
                <label>Operating City</label>

                <input
                  type="text"
                  name="operatingCity"
                  value={formData.operatingCity}
                  onChange={handleChange}
                  placeholder="e.g. Ikeja"
                  required
                />
              </div>

              <div className="verification-field">
                <label>Vehicle Type</label>

                <select
                  name="vehicleType"
                  value={formData.vehicleType}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select vehicle type</option>
                  <option value="bicycle">Bicycle</option>
                  <option value="motorcycle">Motorcycle</option>
                  <option value="car">Car</option>
                  <option value="van">Van</option>
                  <option value="truck">Truck</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="verification-field">
                <label>
                  Vehicle Registration Number
                  <small>Required for verification</small>
                </label>

                <input
                  type="text"
                  name="vehicleRegistration"
                  value={formData.vehicleRegistration}
                  onChange={handleChange}
                  placeholder="Enter vehicle registration"
                  required
                />
              </div>

              <div className="verification-field">
                <label>Will you personally drive?</label>

                <select
                  name="isDriver"
                  value={formData.isDriver}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select an option</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>

              <div className="verification-field">
                <label>
                  Driver&apos;s Licence Number
                  <small>Where applicable</small>
                </label>

                <input
                  type="text"
                  name="licenceNumber"
                  value={formData.licenceNumber}
                  onChange={handleChange}
                  placeholder="Enter licence number"
                />
              </div>
            </div>
          </section>

          {/* REVIEW */}
          <section className="verification-section verification-review-section">
            <div className="verification-section-heading">
              <div className="verification-section-number">03</div>

              <div>
                <span>REVIEW &amp; SUBMIT</span>

                <h2>Ready to submit?</h2>

                <p>
                  Your information will be submitted for verification. Your
                  Dispatcher Workspace requires both identity and vehicle
                  verification.
                </p>
              </div>
            </div>

            <div className="verification-review-box">
              <div className="verification-review-icon">✓</div>

              <div>
                <strong>Verification status: Not submitted</strong>

                <p>
                  Submit your information to begin the Shipora verification
                  process.
                </p>
              </div>
            </div>
          </section>

          <div className="verification-actions">
            <button
              type="button"
              className="verification-secondary-button"
              onClick={() => navigate("/verify-role")}
              disabled={submitting}
            >
              ← Back
            </button>

            <button
              type="submit"
              className="verification-primary-button"
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit for Verification"}
              {!submitting && <span>→</span>}
            </button>
          </div>
        </form>

        <div className="verification-security-note">
          <div className="verification-security-icon">🔒</div>

          <p>
            Your identity information is private and should only be used for
            Shipora&apos;s verification process. Dispatcher access requires
            successful identity and vehicle verification.
          </p>
        </div>
      </section>

      {showModal && (
        <AuthStatusModal
          type="dispatcherVerificationPending"
          onClose={handleModalClose}
        />
      )}
    </main>
  );
}

export default VerifyDispatch;