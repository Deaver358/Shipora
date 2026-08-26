import { useState } from "react";
import { useNavigate } from "react-router-dom";
import shiporaLogo from "../assets/shipora-logo.jpeg";
import "../index.css";

function Contact() {
  const navigate = useNavigate();

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="account-page contact-page">

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
          CONTACT SUPPORT
        </div>

      </header>


      <main className="account-content contact-content">

        <section className="contact-layout">

          <div className="contact-intro">

            <span className="account-eyebrow">
              SHIPORA SUPPORT
            </span>

            <h1>
              We're here to
              <span>help.</span>
            </h1>

            <p>
              Have a question about a shipment, delivery or your
              Shipora account? Send us a message and our support
              team will review your request.
            </p>


            <div className="contact-method">

              <span>EMAIL SUPPORT</span>

              <strong>
                deaver.techh@gmail.com
              </strong>

              <small>
                We will respond to your support request as soon
                as possible.
              </small>

            </div>

          </div>


          <div className="contact-form-card">

            {submitted ? (

              <div className="contact-success">

                <div className="contact-success-icon">
                  ✓
                </div>

                <span className="account-eyebrow">
                  REQUEST RECEIVED
                </span>

                <h2>
                  Thanks for contacting Shipora.
                </h2>

                <p>
                  Your support request has been received.
                  We'll review it and get back to you.
                </p>

                <button
                  onClick={() => {
                    setSubmitted(false);
                  }}
                >
                  Send Another Request
                </button>

              </div>

            ) : (

              <form onSubmit={handleSubmit}>

                <div className="contact-form-heading">
                  <span>SUPPORT REQUEST</span>
                  <h2>Send us a message</h2>
                </div>


                <div className="contact-field">

                  <label htmlFor="contact-subject">
                    SUBJECT
                  </label>

                  <input
                    id="contact-subject"
                    type="text"
                    placeholder="What can we help with?"
                    required
                  />

                </div>


                <div className="contact-field">

                  <label htmlFor="contact-tracking">
                    TRACKING NUMBER
                    <span>OPTIONAL</span>
                  </label>

                  <input
                    id="contact-tracking"
                    type="text"
                    placeholder="e.g. SHP-2048-921"
                  />

                </div>


                <div className="contact-field">

                  <label htmlFor="contact-message">
                    MESSAGE
                  </label>

                  <textarea
                    id="contact-message"
                    rows="7"
                    placeholder="Describe the issue or question..."
                    required
                  ></textarea>

                </div>


                <button
                  className="contact-submit-button"
                  type="submit"
                >
                  Send Support Request
                  <span>→</span>
                </button>

              </form>

            )}

          </div>

        </section>

      </main>

    </div>
  );
}

export default Contact;