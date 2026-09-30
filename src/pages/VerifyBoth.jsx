import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthStatusModal from "../components/AuthStatusModal";
import "../index.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1.0";

function VerifyBoth() {
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

    vendorType: "",
    businessName: "",
    cacNumber: "",
    businessType: "",
    businessPhone: "",
    businessEmail: "",
    businessAddress: "",

    dispatchName: "",
    operatingState: "",
    operatingCity: "",
    serviceArea: "",
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
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSubmitting(true);

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

      vendor_type: formData.vendorType,
      business_name: formData.businessName.trim(),
      cac_number: formData.cacNumber.trim(),
      business_type: formData.businessType.trim(),
      business_phone: formData.businessPhone.trim(),
      business_email: formData.businessEmail.trim(),
      business_address: formData.businessAddress.trim(),

      dispatch_name: formData.dispatchName.trim(),
      operating_state: formData.operatingState.trim(),
      operating_city: formData.operatingCity.trim(),
      service_area: formData.serviceArea.trim(),
      vehicle_type: formData.vehicleType,
      vehicle_registration: formData.vehicleRegistration.trim(),
      is_driver: formData.isDriver === "yes",
      licence_number: formData.licenceNumber.trim(),
    };

    try {
      const response = await fetch(`${API_BASE_URL}/both/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        const detail = responseData?.detail;

        if (Array.isArray(detail)) {
          setError(
            detail
              .map((item) => item?.msg || "Invalid verification information.")
              .join(" ")
          );
        } else {
          setError(
            detail ||
              responseData?.message ||
              "Verification could not be submitted. Please check your information and try again."
          );
        }

        return;
      }

      setShowModal(true);
    } catch (requestError) {
      console.error("Both roles verification error:", requestError);

      setError(
        "Unable to connect to Shipora. Please make sure the backend is running and try again."
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
          >
            ← Back
          </button>

          <div className="verification-eyebrow">
            <span></span>
            SHIPORA ROLE VERIFICATION
          </div>
        </div>

        <div className="verification-header">
          <h1>Verify both Shipora roles.</h1>

          <p>
            Complete your identity once, then provide the information required
            for both Vendor and Dispatch access.
          </p>
        </div>

        <div className="verification-progress">
          <div className="verification-progress-item active">
            <span>01</span>
            <p>Identity</p>
          </div>

          <div className="verification-progress-line"></div>

          <div className="verification-progress-item">
            <span>02</span>
            <p>Vendor</p>
          </div>

          <div className="verification-progress-line"></div>

          <div className="verification-progress-item">
            <span>03</span>
            <p>Dispatch</p>
          </div>

          <div className="verification-progress-line"></div>

          <div className="verification-progress-item">
            <span>04</span>
            <p>Submit</p>
          </div>
        </div>

        <form className="verification-form" onSubmit={handleSubmit}>
          {/* PERSONAL IDENTITY */}

          <section className="verification-section">
            <div className="verification-section-heading">
              <div className="verification-section-number">01</div>

              <div>
                <span>PERSONAL IDENTITY</span>

                <h2>Verify your identity once.</h2>

                <p>
                  Your identity information can support both your Vendor and
                  Dispatch roles.
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

          {/* VENDOR INFORMATION */}

          <section className="verification-section">
            <div className="verification-section-heading">
              <div className="verification-section-number">02</div>

              <div>
                <span>VENDOR VERIFICATION</span>

                <h2>Tell us about your business.</h2>

                <p>
                  Provide the information needed for your Vendor role. CAC
                  registration is optional.
                </p>
              </div>
            </div>

            <div className="verification-grid">
              <div className="verification-field verification-field-full">
                <label>Vendor Type</label>

                <select
                  name="vendorType"
                  value={formData.vendorType}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select vendor type</option>

                  <option value="individual">
                    Individual / Sole Proprietor
                  </option>

                  <option value="registered-business">
                    Registered Business
                  </option>

                  <option value="company">Company</option>
                </select>
              </div>

              <div className="verification-field">
                <label>Business Name</label>

                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  placeholder="Enter your business name"
                  required
                />
              </div>

              <div className="verification-field">
                <label>Business Type</label>

                <input
                  type="text"
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleChange}
                  placeholder="e.g. Retail, Fashion, Food"
                  required
                />
              </div>

              <div className="verification-field">
                <label>
                  CAC Registration Number
                  <small>Optional</small>
                </label>

                <input
                  type="text"
                  name="cacNumber"
                  value={formData.cacNumber}
                  onChange={handleChange}
                  placeholder="Enter CAC registration number"
                />
              </div>

              <div className="verification-field">
                <label>
                  Business Phone Number
                  <small>Optional</small>
                </label>

                <input
                  type="tel"
                  name="businessPhone"
                  value={formData.businessPhone}
                  onChange={handleChange}
                  placeholder="+234 800 000 0000"
                />
              </div>

              <div className="verification-field verification-field-full">
                <label>
                  Business Email
                  <small>Optional</small>
                </label>

                <input
                  type="email"
                  name="businessEmail"
                  value={formData.businessEmail}
                  onChange={handleChange}
                  placeholder="business@example.com"
                />
              </div>

              <div className="verification-field verification-field-full">
                <label>Business Address</label>

                <textarea
                  name="businessAddress"
                  value={formData.businessAddress}
                  onChange={handleChange}
                  placeholder="Enter your business address"
                  rows="4"
                  required
                />
              </div>
            </div>
          </section>

          {/* DISPATCH INFORMATION */}

          <section className="verification-section">
            <div className="verification-section-heading">
              <div className="verification-section-number">03</div>

              <div>
                <span>DISPATCH VERIFICATION</span>

                <h2>Tell us about your delivery operation.</h2>

                <p>
                  Your Dispatch role requires NIN verification and vehicle
                  verification before Dispatch workspace access.
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

              <div className="verification-field verification-field-full">
                <label>Service Area</label>

                <input
                  type="text"
                  name="serviceArea"
                  value={formData.serviceArea}
                  onChange={handleChange}
                  placeholder="Describe the areas where you operate"
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
                <label>Vehicle Registration Number</label>

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
                  Driver's Licence Number
                  <small>Optional</small>
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
              <div className="verification-section-number">04</div>

              <div>
                <span>REVIEW & SUBMIT</span>

                <h2>Submit both roles for verification.</h2>

                <p>
                  Your Vendor and Dispatch information will be submitted
                  together. Each role keeps its own verification status.
                </p>
              </div>
            </div>

            <div className="verification-review-box">
              <div className="verification-review-icon">✓</div>

              <div>
                <strong>Vendor verification</strong>

                <p>
                  NIN is required. CAC is optional and does not block Vendor
                  access.
                </p>
              </div>
            </div>

            <div className="verification-review-box">
              <div className="verification-review-icon">✓</div>

              <div>
                <strong>Dispatch verification</strong>

                <p>
                  NIN and vehicle verification are required before Dispatch
                  workspace access.
                </p>
              </div>
            </div>

            {error && (
              <div
                className="verification-error"
                role="alert"
                style={{ marginTop: "20px" }}
              >
                {error}
              </div>
            )}
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
              {submitting
                ? "Submitting..."
                : "Submit Both for Verification"}

              <span>→</span>
            </button>
          </div>
        </form>

        <div className="verification-security-note">
          <div className="verification-security-icon">🔒</div>

          <p>
            Your identity information is collected once and can support both
            Shipora roles. Each role maintains its own verification status.
          </p>
        </div>
      </section>

      {showModal && (
        <AuthStatusModal
          type="bothVerificationPending"
          onClose={handleModalClose}
        />
      )}
    </main>
  );
}

export default VerifyBoth;