import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../index.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1.0";

function Star({ filled, onClick, disabled }) {
  return (
    <button
      type="button"
      className={`rating-star ${filled ? "filled" : ""}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={`${filled ? "Selected" : "Select"} star`}
    >
      ★
    </button>
  );
}

function Rating() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const shipmentId = searchParams.get("shipment_id");

  const [score, setScore] = useState(0);
  const [comment, setComment] = useState("");
  const [hoverScore, setHoverScore] = useState(0);

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!shipmentId) {
      setError("No shipment was provided for this rating.");
    }

    setChecking(false);
  }, [shipmentId]);

  const activeScore = hoverScore || score;

  const getRatingLabel = () => {
    switch (activeScore) {
      case 1:
        return "Needs improvement";
      case 2:
        return "Below expectations";
      case 3:
        return "Good";
      case 4:
        return "Very good";
      case 5:
        return "Excellent";
      default:
        return "Select a rating";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!shipmentId) {
      setError("No shipment was provided for this rating.");
      return;
    }

    if (!score) {
      setError("Please select a star rating.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/ratings`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shipment_id: shipmentId,
          score,
          comment: comment.trim() || null,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            data?.message ||
            "Unable to submit your rating."
        );
      }

      setSuccess(true);
    } catch (err) {
      setError(
        err.message ||
          "Something went wrong while submitting your rating."
      );
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <main className="rating-page">
        <section className="rating-card rating-loading-card">
          <div className="rating-loading-icon">★</div>

          <span className="rating-eyebrow">SHIPORA RATING</span>

          <h1>Preparing your rating</h1>

          <p>
            Please wait while we prepare this shipment for review.
          </p>

          <div className="rating-loading-bar"></div>
        </section>
      </main>
    );
  }

  if (success) {
    return (
      <main className="rating-page">
        <section className="rating-card rating-success-card">
          <div className="rating-success-icon">✓</div>

          <span className="rating-eyebrow">RATING SUBMITTED</span>

          <h1>Thank you for your feedback</h1>

          <p>
            Your rating has been recorded successfully and helps
            keep the Shipora delivery network accountable.
          </p>

          <div className="submitted-stars">
            {Array.from({ length: 5 }).map((_, index) => (
              <span
                key={index}
                className={index < score ? "active" : ""}
              >
                ★
              </span>
            ))}
          </div>

          <button
            type="button"
            className="full-primary-button"
            onClick={() => navigate("/dashboard")}
          >
            Back to Dashboard
            <span>→</span>
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="rating-page">
      <section className="rating-card">
        <button
          className="back-button"
          type="button"
          onClick={() => navigate("/dashboard")}
        >
          ← Back to Dashboard
        </button> <br />

        <span className="rating-eyebrow">
          SHIPMENT COMPLETED
        </span>

        <h1>Rate your Shipora experience</h1>

        <p className="rating-intro">
          Your feedback helps build a reliable delivery network
          for vendors and dispatchers.
        </p>

        {error && (
          <div className="wallet-action-error" role="alert">
            <span>!</span>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="rating-selection">
            <span className="rating-section-label">
              YOUR RATING
            </span>

            <div
              className="rating-stars"
              onMouseLeave={() => setHoverScore(0)}
            >
              {Array.from({ length: 5 }).map((_, index) => {
                const starValue = index + 1;

                return (
                  <Star
                    key={starValue}
                    filled={starValue <= activeScore}
                    disabled={loading}
                    onClick={() => setScore(starValue)}
                  />
                );
              })}
            </div>

            <strong className="rating-label">
              {getRatingLabel()}
            </strong>
          </div>

          <div className="rating-comment-field">
            <label htmlFor="rating-comment">
              Comment <span>(optional)</span>
            </label>

            <textarea
              id="rating-comment"
              value={comment}
              maxLength={1000}
              disabled={loading}
              onChange={(e) => {
                setComment(e.target.value);
                setError("");
              }}
              placeholder="Share a little about your delivery experience..."
              rows={5}
            />

            <small>
              {comment.length}/1000
            </small>
          </div>

          <button
            type="submit"
            className="full-primary-button"
            disabled={loading || !score || !shipmentId}
          >
            {loading ? "Submitting rating..." : "Submit Rating"}
            {!loading && <span>→</span>}
          </button>
        </form>

        <div className="rating-secure-note">
          <span>★</span>

          <p>
            Ratings are linked to completed shipments and can only
            be submitted once by each participant.
          </p>
        </div>
      </section>
    </main>
  );
}

export default Rating;