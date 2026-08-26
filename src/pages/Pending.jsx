import { useNavigate } from "react-router-dom";
import "../index.css";

function Pending() {
  const navigate = useNavigate();

  return (
    <main className="status-page">
      <section className="status-card pending-card">

        <div className="status-stamp pending-stamp">
          <span className="stamp-icon">!</span>
          <span>PENDING</span>
        </div>

        <div className="status-content">
          <span className="status-eyebrow">
            <i></i>
            VERIFICATION PENDING
          </span>

          <h1>Your request is pending.</h1>

          <p>
            Your account verification request has been received and is waiting
            to be reviewed. We will update your account once the verification
            process begins.
          </p>

          <div className="status-info-box">
            <div className="status-info-icon">⌛</div>

            <div>
              <strong>What happens next?</strong>

              <span>
                Our verification team will review the information you
                submitted.
              </span>
            </div>
          </div>

          <button
            type="button"
            className="status-back-button"
            onClick={() => navigate(-1)}
          >
            <span>←</span>
            Go Back
          </button>
        </div>

      </section>
    </main>
  );
}

export default Pending;