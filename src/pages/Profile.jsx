import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import shiporaLogo from "../assets/shipora-logo.jpeg";
import { api } from "../interceptors/api";
import {
  getCachedProfile,
  setCachedProfile,
} from "../utils/profileCache";
import "../styles/change.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1.0";

function isVerified(value) {
  if (value === true) return true;

  if (typeof value === "string") {
    return [
      "verified",
      "VERIFIED",
      "success",
      "successful",
      "approved",
    ].includes(value.trim());
  }

  return false;
}

function VerifiedShape({ color }) {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{ display: "block", flexShrink: 0 }}
    >
      <g fill={color}>
        <circle cx="12" cy="12" r="8.6" />

        {[0, 45, 90, 135].map((deg) => (
          <rect
            key={deg}
            x="4.2"
            y="4.2"
            width="15.6"
            height="15.6"
            rx="4.2"
            transform={`rotate(${deg} 12 12)`}
          />
        ))}
      </g>

      <path
        d="M7.2 12.4L10.5 15.6L16.9 8.6"
        fill="none"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function VerificationBadge({ type, label }) {
  const badgeStyles = {
    identity: {
      background: "#16a34a",
      text: "#15803d",
      pillBackground: "#ecfdf3",
      pillBorder: "#bbf7d0",
    },

    business: {
      background: "#2563eb",
      text: "#2563eb",
      pillBackground: "#eff6ff",
      pillBorder: "#bfdbfe",
    },

    dispatch: {
      background: "#7c3aed",
      text: "#7c3aed",
      pillBackground: "#f5f3ff",
      pillBorder: "#ddd6fe",
    },
  };

  const style = badgeStyles[type] || badgeStyles.identity;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "7px",
        padding: "5px 10px 5px 6px",
        borderRadius: "999px",
        background: style.pillBackground,
        border: `1px solid ${style.pillBorder}`,
        color: style.text,
        fontSize: "12px",
        fontWeight: 700,
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      <VerifiedShape color={style.background} />
      {label}
    </span>
  );
}

function Profile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [fullname, setFullname] = useState("");
  const [phone, setPhone] = useState("");

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadProfile = async ({ force = false } = {}) => {
    try {
      setError("");

      if (!force) {
        const cachedProfile = getCachedProfile();

        if (cachedProfile) {
          setProfile(cachedProfile);
          setFullname(cachedProfile.fullname || "");
          setPhone(cachedProfile.phone || "");
          setLoading(false);
          return;
        }
      }

      setLoading(true);

      const response = await api.get("profile/me");
      const data = response.data;

      setProfile(data);
      setFullname(data.fullname || "");
      setPhone(data.phone || "");

      setCachedProfile(data);
    } catch (err) {
      console.error("Unable to load profile:", err);

      setError(
        err?.response?.data?.detail ||
          "Unable to load your profile. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleAvatarClick = () => {
    if (!avatarUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Please choose a JPG, PNG, or WebP image.");
      event.target.value = "";
      return;
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      setError("Profile picture must be 5MB or smaller.");
      event.target.value = "";
      return;
    }

    let temporaryPreview = null;

    try {
      setAvatarUploading(true);
      setError("");
      setSuccess("");

      temporaryPreview = URL.createObjectURL(file);
      setAvatarPreview(temporaryPreview);

      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post(
        "uploads/avatar",
        formData
      );

      const uploadedUrl = response?.data?.url;

      if (!uploadedUrl) {
        throw new Error(
          "Avatar upload did not return an image URL."
        );
      }

      const updatedProfile = {
        ...profile,
        avatar_url: uploadedUrl,
      };

      setAvatarPreview(uploadedUrl);
      setProfile(updatedProfile);
      setCachedProfile(updatedProfile);

      setSuccess("Profile picture updated successfully.");

      setTimeout(() => {
        setSuccess("");
      }, 2500);

      if (temporaryPreview) {
        URL.revokeObjectURL(temporaryPreview);
      }
    } catch (err) {
      console.error("Avatar upload failed:", err);

      if (temporaryPreview) {
        URL.revokeObjectURL(temporaryPreview);
      }

      setAvatarPreview(null);

      setError(
        err?.response?.data?.detail ||
          "Unable to upload your profile picture. Please try again."
      );
    } finally {
      setAvatarUploading(false);
      event.target.value = "";
    }
  };

  const handleAvatarDelete = async () => {
    if (!profile?.avatar_url && !avatarPreview) return;

    try {
      setAvatarUploading(true);
      setError("");
      setSuccess("");

      await api.delete("uploads/avatar");

      const updatedProfile = {
        ...profile,
        avatar_url: null,
      };

      setAvatarPreview(null);
      setProfile(updatedProfile);
      setCachedProfile(updatedProfile);

      setSuccess("Profile picture removed successfully.");

      setTimeout(() => {
        setSuccess("");
      }, 2500);
    } catch (err) {
      console.error("Avatar deletion failed:", err);

      setError(
        err?.response?.data?.detail ||
          "Unable to remove your profile picture. Please try again."
      );
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSave = async () => {
    if (!fullname.trim()) {
      setError("Full name is required.");
      return;
    }

    if (!phone.trim()) {
      setError("Phone number is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch(`${API_URL}/profile/me`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullname: fullname.trim(),
          phone: phone.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail || "Unable to update your profile."
        );
      }

      setProfile(data);
      setFullname(data.fullname || "");
      setPhone(data.phone || "");

      // Keep the shared profile cache synchronized.
      setCachedProfile(data);

      setEditing(false);
      setSuccess("Profile updated successfully.");

      setTimeout(() => {
        setSuccess("");
      }, 2500);
    } catch (err) {
      setError(
        err.message || "Unable to update your profile."
      );
    } finally {
      setSaving(false);
    }
  };

  const getInitial = () => {
    if (!profile?.fullname) return "S";

    return profile.fullname
      .trim()
      .charAt(0)
      .toUpperCase();
  };

  const getRole = () => {
    if (!profile?.role) return "Account";

    return profile.role
      .toString()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const renderStars = (rating = 0) => {
    const roundedRating = Math.round(Number(rating) || 0);

    return (
      <div className="profile-rating-stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={star <= roundedRating ? "filled" : ""}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const renderVendorBadges = (vendor) => {
    const ninVerified =
      isVerified(vendor?.nin_verified) ||
      isVerified(vendor?.nin_verification_status);

    const cacVerified =
      isVerified(vendor?.cac_verified) ||
      isVerified(vendor?.cac_verification_status);

    return (
      <>
        {ninVerified && (
          <VerificationBadge
            type="identity"
            label="Identity Verified"
          />
        )}

        {cacVerified && (
          <VerificationBadge
            type="business"
            label="Business Verified"
          />
        )}
      </>
    );
  };

  const renderDispatcherBadges = (dispatcher) => {
    const ninVerified =
      isVerified(dispatcher?.nin_verified) ||
      isVerified(dispatcher?.nin_verification_status);

    const vehicleVerified =
      isVerified(dispatcher?.vehicle_verified) ||
      isVerified(dispatcher?.vehicle_verification_status);

    return (
      <>
        {ninVerified && (
          <VerificationBadge
            type="identity"
            label="Identity Verified"
          />
        )}

        {vehicleVerified && (
          <VerificationBadge
            type="dispatch"
            label="Dispatch Verified"
          />
        )}
      </>
    );
  };

  const renderBothBadges = (both) => {
    const ninVerified =
      isVerified(both?.nin_verified) ||
      isVerified(both?.nin_verification_status);

    const cacVerified =
      isVerified(both?.cac_verified) ||
      isVerified(both?.cac_verification_status);

    const vehicleVerified =
      isVerified(both?.vehicle_verified) ||
      isVerified(both?.vehicle_verification_status);

    return (
      <>
        {ninVerified && (
          <VerificationBadge
            type="identity"
            label="Identity Verified"
          />
        )}

        {cacVerified && (
          <VerificationBadge
            type="business"
            label="Business Verified"
          />
        )}

        {vehicleVerified && (
          <VerificationBadge
            type="dispatch"
            label="Dispatch Verified"
          />
        )}
      </>
    );
  };

  if (loading) {
    return (
      <div className="account-page profile-page">
        <header className="account-topbar">
          <button
            type="button"
            className="account-back-button"
            onClick={() => navigate(-1)}
          >
            ← Back
          </button>

          <span className="account-page-label">
            PROFILE
          </span>
        </header>

        <main className="account-content">
          <div className="profile-loading">
            <div className="profile-loading-card">
              <div className="profile-loading-avatar"></div>

              <div className="profile-loading-lines">
                <div className="profile-loading-line profile-loading-line-title"></div>
                <div className="profile-loading-line"></div>
                <div className="profile-loading-line short"></div>
              </div>

              <div className="profile-loading-grid">
                <div className="profile-loading-block"></div>
                <div className="profile-loading-block"></div>
                <div className="profile-loading-block"></div>
              </div>

              <div className="profile-loading-message">
                <span className="profile-loading-spinner"></span>
                Preparing your profile...
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!profile) {
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

          <img
            src={shiporaLogo}
            alt="Shipora"
            className="app-logo"
          />

          <div className="account-page-label">
            PROFILE
          </div>
        </header>

        <main className="account-content">
          <div className="profile-error-card">
            <strong>Unable to load profile</strong>

            <p>{error || "Please try again."}</p>

            <button onClick={() => loadProfile({ force: true })}>
              Try Again
            </button>
          </div>
        </main>
      </div>
    );
  }

  const vendor = profile.vendor;
  const dispatcher = profile.dispatcher;
  const both = profile.both;

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

        <img
          src={shiporaLogo}
          alt="Shipora"
          className="app-logo"
        />

        <div className="account-page-label">
          PROFILE
        </div>
      </header>

      <main className="account-content">
        {error && (
          <div className="profile-message profile-message-error">
            {error}
          </div>
        )}

        {success && (
          <div className="profile-message profile-message-success">
            {success}
          </div>
        )}

        <section className="account-hero-card">
          <div className="profile-cover-glow"></div>

          <div className="profile-avatar-wrapper">
            {avatarPreview || profile.avatar_url ? (
              <img
                src={avatarPreview || profile.avatar_url}
                alt={profile.fullname || "Profile"}
                className="profile-avatar-image"
              />
            ) : (
              <div className="profile-avatar">
                {getInitial()}
              </div>
            )}

            <button
              type="button"
              className="profile-avatar-add"
              onClick={(event) => {
                event.stopPropagation();
                handleAvatarClick();
              }}
              disabled={avatarUploading}
              aria-label="Change profile picture"
              title="Change profile picture"
            >
              +
            </button>

            {(avatarPreview || profile.avatar_url) && (
              <button
                type="button"
                className="profile-avatar-delete"
                onClick={(event) => {
                  event.stopPropagation();
                  handleAvatarDelete();
                }}
                disabled={avatarUploading}
                aria-label="Remove profile picture"
                title="Remove profile picture"
              >
                ×
              </button>
            )}

            {avatarUploading && (
              <div className="profile-avatar-uploading">
                <span className="profile-avatar-spinner" />
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarChange}
              hidden
            />
          </div>

          <div className="profile-hero-info">
            <span className="account-eyebrow">
              SHIPORA ACCOUNT
            </span>

            <h1>{profile.fullname}</h1>

            <p>{profile.email}</p>

            <div className="profile-badges">
              <span className="profile-role-badge">
                {getRole()}
              </span>

              <span className="profile-status-badge">
                <i></i>
                Active Account
              </span>
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
                marginTop: "12px",
              }}
            >
              {vendor && renderVendorBadges(vendor)}
              {dispatcher &&
                renderDispatcherBadges(dispatcher)}
              {both && renderBothBadges(both)}
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
              Your information is managed through your Shipora account.
            </p>
          </div>

          <div className="profile-details-grid">
            <div className="profile-detail-card">
              <span>FULL NAME</span>

              {editing ? (
                <input
                  type="text"
                  value={fullname}
                  onChange={(e) =>
                    setFullname(e.target.value)
                  }
                />
              ) : (
                <strong>{profile.fullname || "—"}</strong>
              )}
            </div>

            <div className="profile-detail-card">
              <span>EMAIL ADDRESS</span>
              <strong>{profile.email || "—"}</strong>
            </div>

            <div className="profile-detail-card">
              <span>PHONE NUMBER</span>

              {editing ? (
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value)
                  }
                />
              ) : (
                <strong>{profile.phone || "—"}</strong>
              )}
            </div>

            <div className="profile-detail-card">
              <span>ACCOUNT ROLE</span>
              <strong>{getRole()}</strong>
            </div>
          </div>

          <div className="profile-edit-actions">
            {!editing ? (
              <button
                className="profile-edit-button"
                onClick={() => {
                  setError("");
                  setSuccess("");
                  setEditing(true);
                }}
              >
                Edit Profile
              </button>
            ) : (
              <>
                <button
                  className="profile-cancel-button"
                  onClick={() => {
                    setFullname(profile.fullname || "");
                    setPhone(profile.phone || "");
                    setError("");
                    setEditing(false);
                  }}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  className="profile-save-button"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </>
            )}
          </div>
        </section>

        {vendor && (
          <section className="account-section">
            <div className="account-section-heading">
              <span>VENDOR PROFILE</span>

              <h2>Business information</h2>

              <p>
                Information associated with your vendor account.
              </p>
            </div>

            <div className="profile-details-grid">
              <div className="profile-detail-card">
                <span>BUSINESS NAME</span>
                <strong>{vendor.business_name || "—"}</strong>
              </div>

              <div className="profile-detail-card">
                <span>VENDOR TYPE</span>
                <strong>{vendor.vendor_type || "—"}</strong>
              </div>

              <div className="profile-detail-card">
                <span>NIN VERIFICATION</span>

                <strong>
                  {isVerified(vendor.nin_verification_status) ||
                  isVerified(vendor.nin_verified)
                    ? "Verified"
                    : "Pending"}
                </strong>
              </div>

              <div className="profile-detail-card">
                <span>CAC VERIFICATION</span>

                <strong>
                  {isVerified(vendor.cac_verification_status) ||
                  isVerified(vendor.cac_verified)
                    ? "Verified"
                    : "Pending"}
                </strong>
              </div>

              <div className="profile-detail-card">
                <span>RATING</span>

                <div className="profile-rating-value">
                  {renderStars(vendor.average_rating)}

                  <strong>
                    {Number(
                      vendor.average_rating || 0
                    ).toFixed(1)}
                  </strong>

                  <small>
                    ({vendor.total_ratings || 0} ratings)
                  </small>
                </div>
              </div>

              <div className="profile-detail-card">
                <span>PAYOUT ACCOUNT</span>

                <strong>
                  {vendor.has_payout_account
                    ? vendor.account_name || "Connected"
                    : "Not connected"}
                </strong>
              </div>
            </div>
          </section>
        )}

        {dispatcher && (
          <section className="account-section">
            <div className="account-section-heading">
              <span>DISPATCHER PROFILE</span>

              <h2>Dispatch information</h2>

              <p>
                Information associated with your dispatcher account.
              </p>
            </div>

            <div className="profile-details-grid">
              <div className="profile-detail-card">
                <span>DISPATCH NAME</span>
                <strong>
                  {dispatcher.dispatch_name || "—"}
                </strong>
              </div>

              <div className="profile-detail-card">
                <span>VEHICLE TYPE</span>
                <strong>
                  {dispatcher.vehicle_type || "—"}
                </strong>
              </div>

              <div className="profile-detail-card">
                <span>NIN VERIFICATION</span>

                <strong>
                  {isVerified(
                    dispatcher.nin_verification_status
                  ) ||
                  isVerified(dispatcher.nin_verified)
                    ? "Verified"
                    : "Pending"}
                </strong>
              </div>

              <div className="profile-detail-card">
                <span>VEHICLE VERIFICATION</span>

                <strong>
                  {isVerified(
                    dispatcher.vehicle_verification_status
                  ) ||
                  isVerified(dispatcher.vehicle_verified)
                    ? "Verified"
                    : "Pending"}
                </strong>
              </div>

              <div className="profile-detail-card">
                <span>RATING</span>

                <div className="profile-rating-value">
                  {renderStars(dispatcher.average_rating)}

                  <strong>
                    {Number(
                      dispatcher.average_rating || 0
                    ).toFixed(1)}
                  </strong>

                  <small>
                    ({dispatcher.total_ratings || 0} ratings)
                  </small>
                </div>
              </div>

              <div className="profile-detail-card">
                <span>PAYOUT ACCOUNT</span>

                <strong>
                  {dispatcher.has_payout_account
                    ? dispatcher.account_name || "Connected"
                    : "Not connected"}
                </strong>
              </div>
            </div>
          </section>
        )}

        {both && (
          <section className="account-section">
            <div className="account-section-heading">
              <span>BOTH ROLES PROFILE</span>

              <h2>Vendor & dispatch information</h2>

              <p>
                Information associated with your combined Shipora account.
              </p>
            </div>

            <div className="profile-details-grid">
              <div className="profile-detail-card">
                <span>BUSINESS NAME</span>
                <strong>{both.business_name || "—"}</strong>
              </div>

              <div className="profile-detail-card">
                <span>DISPATCH NAME</span>
                <strong>{both.dispatch_name || "—"}</strong>
              </div>

              <div className="profile-detail-card">
                <span>NIN VERIFICATION</span>

                <strong>
                  {isVerified(
                    both.nin_verification_status
                  ) ||
                  isVerified(both.nin_verified)
                    ? "Verified"
                    : "Pending"}
                </strong>
              </div>

              <div className="profile-detail-card">
                <span>CAC VERIFICATION</span>

                <strong>
                  {isVerified(
                    both.cac_verification_status
                  ) ||
                  isVerified(both.cac_verified)
                    ? "Verified"
                    : "Pending"}
                </strong>
              </div>

              <div className="profile-detail-card">
                <span>VEHICLE VERIFICATION</span>

                <strong>
                  {isVerified(
                    both.vehicle_verification_status
                  ) ||
                  isVerified(both.vehicle_verified)
                    ? "Verified"
                    : "Pending"}
                </strong>
              </div>

              <div className="profile-detail-card">
                <span>VEHICLE TYPE</span>
                <strong>{both.vehicle_type || "—"}</strong>
              </div>
            </div>
          </section>
        )}

        <section className="profile-info-banner">
          <div className="profile-info-icon">✓</div>

          <div>
            <strong>Account information</strong>

            <p>
              Your profile information is retrieved directly from
              your Shipora account.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Profile;