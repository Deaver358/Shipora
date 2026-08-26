import { useNavigate } from "react-router-dom";
import "../index.css";

function Review() {
  const navigate = useNavigate();

  return (
    <main className="verification-status-page">

      <section className="verification-status-card review-card">

        <div className="status-stamp review-stamp">
          <span className="status-icon">⌛</span>
          <strong>UNDER REVIEW</strong>
        </div>

        <div className="status-content">

          <span className="status-eyebrow">
            VERIFICATION STATUS
          </span>

          <h1>
            Your account is under review.
          </h1>

          <p>
            We are currently reviewing the information and documents you
            submitted. This usually does not take long.
          </p>

          <div className="status-info-box review-info-box">

            <div className="status-info-dot"></div>

            <div>
              <strong>
                Verification in progress
              </strong>

              <span>
                You will be able to continue once your account has been reviewed.
              </span>
            </div>

          </div>

          <p className="status-small-text">
            You can return to the previous page while we complete the review.
          </p>

        </div>

        <button
          type="button"
          className="status-back-button"
          onClick={() => navigate(-1)}
        >
          <span>←</span>
          Go Back
        </button>

      </section>

    </main>
  );
}

export default Review;