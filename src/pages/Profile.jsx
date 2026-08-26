import { useState } from "react";
import { useNavigate } from "react-router-dom";
import shiporaLogo from "../assets/shipora-logo.jpeg";
import "../index.css";

function Profile() {
  const navigate = useNavigate();

  const [profileImage, setProfileImage] = useState(null);

  const user = {
    name: "David Emmanuel",
    email: "deaver.techh@gmail.com",
    phone: "080XXXXXXXX",
    role: "Vendor",
    memberSince: "August 2026",
    accountId: "SHP-USER-2048",
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    setProfileImage(imageUrl);
  };

  return (
    <div className="account-page profile-page">

      <header className="account-topbar">

        <button
          className="account-back-button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          ←
        </button>

        <img src={shiporaLogo} alt="Shipora" className="app-logo" />
        
        <div className="account-page-label">
          PROFILE
        </div>

      </header>

      <main className="account-content">

        <section className="account-hero-card">

          <div className="profile-cover-glow"></div>

          <div className="profile-avatar-wrapper">

            {profileImage ? (
              <img
                src={profileImage}
                alt="Profile"
                className="profile-avatar-image"
              />
            ) : (
              <div className="profile-avatar">
                {user.name.charAt(0)}
              </div>
            )}

            <label
              className="profile-upload-button"
              htmlFor="profile-image-upload"
              title="Upload profile image"
            >
              +
            </label>

            <input
              id="profile-image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              hidden
            />

          </div>

          <div className="profile-hero-info">

            <span className="account-eyebrow">
              SHIPORA ACCOUNT
            </span>

            <h1>{user.name}</h1>

            <p>{user.email}</p>

            <div className="profile-badges">

              <span className="profile-role-badge">
                {user.role}
              </span>

              <span className="profile-status-badge">
                <i></i>
                Active Account
              </span>

            </div>

          </div>

          <button
            className="profile-settings-button"
            onClick={() => navigate("/settings")}
          >
            <span>⚙</span>
            Settings
          </button>

        </section>


        <section className="account-section">

          <div className="account-section-heading">
            <span>ACCOUNT INFORMATION</span>
            <h2>Your registered details</h2>
            <p>
              These details are associated with your Shipora account.
            </p>
          </div>


          <div className="profile-details-grid">

            <div className="profile-detail-card">
              <span>FULL NAME</span>
              <strong>{user.name}</strong>
            </div>

            <div className="profile-detail-card">
              <span>EMAIL ADDRESS</span>
              <strong>{user.email}</strong>
            </div>

            <div className="profile-detail-card">
              <span>PHONE NUMBER</span>
              <strong>{user.phone}</strong>
            </div>

            <div className="profile-detail-card">
              <span>ACCOUNT ROLE</span>
              <strong>{user.role}</strong>
            </div>

            <div className="profile-detail-card">
              <span>MEMBER SINCE</span>
              <strong>{user.memberSince}</strong>
            </div>

            <div className="profile-detail-card">
              <span>ACCOUNT ID</span>
              <strong>{user.accountId}</strong>
            </div>

          </div>

        </section>


        <section className="profile-info-banner">

          <div className="profile-info-icon">
            ✓
          </div>

          <div>
            <strong>Your account information</strong>
            <p>
              Your profile details are the information you provided
              when registering with Shipora. Profile editing will be
              available when account management is connected to the
              Shipora backend.
            </p>
          </div>

        </section>

      </main>

    </div>
  );
}

export default Profile;