import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthStatusModal from "../components/AuthStatusModal";
import "../index.css";

function VerifyVendor() {
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);

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
  });

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    /*
      FRONTEND PROTOTYPE ONLY

      This does not perform real NIN or CAC verification.
      The form currently submits the user into a
      "verification under review" state.
    */

    setShowModal(true);
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
            VENDOR VERIFICATION
          </div>

        </div>


        <div className="verification-header">

          <h1>
            Verify your vendor account.
          </h1>

          <p>
            Complete your identity and business information
            to request access to Shipora's vendor features.
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
            <p>Business Details</p>
          </div>

          <div className="verification-progress-line"></div>

          <div className="verification-progress-item">
            <span>03</span>
            <p>Review & Submit</p>
          </div>

        </div>


        <form
          className="verification-form"
          onSubmit={handleSubmit}
        >

          {/* PERSONAL IDENTITY */}

          <section className="verification-section">

            <div className="verification-section-heading">

              <div className="verification-section-number">
                01
              </div>

              <div>

                <span>
                  PERSONAL IDENTITY
                </span>

                <h2>
                  Tell us who you are.
                </h2>

                <p>
                  Your identity information is used to support
                  your Shipora account verification.
                </p>

              </div>

            </div>


            <div className="verification-grid">

              <div className="verification-field">

                <label>
                  Legal First Name
                </label>

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

                <label>
                  Legal Surname
                </label>

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

                <label>
                  Date of Birth
                </label>

                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  required
                />

              </div>


              <div className="verification-field">

                <label>
                  Phone Number
                </label>

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

                <label>
                  Email Address
                </label>

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

                <label>
                  Nationality
                </label>

                <input
                  type="text"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleChange}
                  required
                />

              </div>


              <div className="verification-field">

                <label>
                  State of Residence
                </label>

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

                <label>
                  Local Government Area
                </label>

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

                <label>
                  Residential Address
                </label>

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
                  Your NIN is used only for verification.
                  Never share it publicly.
                </p>

              </div>

            </div>

          </section>


          {/* BUSINESS DETAILS */}

          <section className="verification-section">

            <div className="verification-section-heading">

              <div className="verification-section-number">
                02
              </div>

              <div>

                <span>
                  BUSINESS INFORMATION
                </span>

                <h2>
                  Tell us about your business.
                </h2>

                <p>
                  This information helps us understand how
                  you intend to use Shipora as a vendor.
                </p>

              </div>

            </div>


            <div className="verification-grid">

              <div className="verification-field verification-field-full">

                <label>
                  Vendor Type
                </label>

                <select
                  name="vendorType"
                  value={formData.vendorType}
                  onChange={handleChange}
                  required
                >

                  <option value="">
                    Select vendor type
                  </option>

                  <option value="individual">
                    Individual / Sole Proprietor
                  </option>

                  <option value="registered-business">
                    Registered Business
                  </option>

                  <option value="company">
                    Company
                  </option>

                </select>

              </div>


              <div className="verification-field">

                <label>
                  Business Name
                </label>

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

                <label>
                  Business Type
                </label>

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
                  <small>Where applicable</small>
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

                <label>
                  Business Address
                </label>

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


          {/* REVIEW */}

          <section className="verification-section verification-review-section">

            <div className="verification-section-heading">

              <div className="verification-section-number">
                03
              </div>

              <div>

                <span>
                  REVIEW & SUBMIT
                </span>

                <h2>
                  Ready to submit?
                </h2>

                <p>
                  Your information will be submitted for
                  review. Submitting this form does not mean
                  that your identity or business has already
                  been verified.
                </p>

              </div>

            </div>


            <div className="verification-review-box">

              <div className="verification-review-icon">
                ✓
              </div>

              <div>

                <strong>
                  Verification status: Not submitted
                </strong>

                <p>
                  After submission, your vendor verification
                  will be marked as pending review.
                </p>

              </div>

            </div>

          </section>


          <div className="verification-actions">

            <button
              type="button"
              className="verification-secondary-button"
              onClick={() => navigate("/verify-role")}
            >
              ← Back
            </button>


            <button
              type="submit"
              className="verification-primary-button"
            >
              Submit for Verification
              <span>→</span>
            </button>

          </div>

        </form>


        <div className="verification-security-note">

          <div className="verification-security-icon">
            🔒
          </div>

          <p>
            Your verification information is private and
            should only be used for Shipora's account
            verification process.
          </p>

        </div>

      </section>


      {showModal && (

        <AuthStatusModal
          type="vendorVerificationPending"
          onClose={handleModalClose}
        />

      )}

    </main>
  );
}

export default VerifyVendor;