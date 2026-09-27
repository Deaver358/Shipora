import { useState } from "react";
import "../index.css";

function Rating() {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [review, setReview] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!rating) return;

    setSubmitted(true);
  };

  return (
    <main className="rating-page">
      <section className="rating-card">

        <span className="page-eyebrow">
          SHIPORA DELIVERY
        </span>

        <h1>Rate your delivery</h1>

        <p>
          Share your experience with this shipment.
        </p>

        <div className="rating-stars">

          {[1, 2, 3, 4, 5].map((star) => (
            <button
              type="button"
              key={star}
              className={
                star <= (hover || rating)
                  ? "rating-star active"
                  : "rating-star"
              }
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
            >
              ★
            </button>
          ))}

        </div>

        <span className="rating-label">
          {rating
            ? `${rating} out of 5`
            : "Select a rating"}
        </span>

        <form onSubmit={handleSubmit}>

          <label className="field-label">
            Review
          </label>

          <textarea
            className="large-textarea"
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Tell us about your experience..."
            rows="6"
          />

          <button
            type="submit"
            className="full-primary-button"
            disabled={!rating}
          >
            Submit Review
            <span>→</span>
          </button>

        </form>

        {submitted && (
          <div className="action-message">
            Thank you. Your review has been submitted.
          </div>
        )}

      </section>
    </main>
  );
}

export default Rating;