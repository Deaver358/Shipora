import { useState } from "react";
import "../index.css";

function Admin() {
  const [status, setStatus] = useState("In Transit");
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");
  const [updated, setUpdated] = useState(false);

  const handleUpdate = () => {
    setUpdated(true);
  };

  return (
    <main className="admin-page">

      {/* Header */}

      <section className="admin-header">
        <div>
          <span className="admin-eyebrow">SHIPORA CONTROL CENTER</span>

          <h1>Shipment Dashboard</h1>

          <p>
            Manage shipments, payments and delivery updates from one place.
          </p>
        </div>

        <a
  href="/admin/create-shipment"
  className="admin-create-btn"
>
  + Create Shipment
</a>
      </section>


      {/* Statistics */}

      <section className="admin-stats">

        <div className="admin-stat">
          <span>Total Shipments</span>
          <strong>128</strong>
          <small>All shipments</small>
        </div>

        <div className="admin-stat">
          <span>In Transit</span>
          <strong>46</strong>
          <small>Currently moving</small>
        </div>

        <div className="admin-stat">
          <span>Delivered</span>
          <strong>71</strong>
          <small>Successfully delivered</small>
        </div>

        <div className="admin-stat">
          <span>Pending Payments</span>
          <strong>11</strong>
          <small>Awaiting confirmation</small>
        </div>

      </section>


      {/* Shipment Management */}

      <section className="admin-panel">

        <div className="panel-heading">

          <div>
            <span>SHIPMENTS</span>
            <h2>Manage Shipments</h2>
          </div>

          <input
            type="search"
            placeholder="Search tracking number..."
          />

        </div>


        {/* Shipment */}

        <div className="admin-shipment">

          <div className="shipment-main">

            <div>
              <small>TRACKING NUMBER</small>
              <strong>SP-2048-921</strong>
            </div>

            <div>
              <small>CUSTOMER</small>
              <strong>John Doe</strong>
            </div>

            <div>
              <small>DESTINATION</small>
              <strong>New York, USA</strong>
            </div>

            <div>
              <small>PAYMENT</small>
              <span className="payment-paid">
                Paid
              </span>
            </div>

          </div>


          {/* Update Shipment */}

          <div className="shipment-update">

            <div className="update-heading">
              <div>
                <span>TRACKING UPDATE</span>
                <h3>Update Shipment</h3>
              </div>

              {updated && (
                <div className="update-success">
                  Updated
                </div>
              )}
            </div>


            <div className="update-grid">

              <div className="form-field">

                <label>Status</label>

                <select
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value)
                  }
                >
                  <option>Pending</option>
                  <option>Processing</option>
                  <option>Dispatched</option>
                  <option>In Transit</option>
                  <option>Out for Delivery</option>
                  <option>Delivered</option>
                </select>

              </div>


              <div className="form-field">

                <label>Current Location</label>

                <input
                  type="text"
                  value={location}
                  onChange={(event) =>
                    setLocation(event.target.value)
                  }
                  placeholder="e.g. Lagos Distribution Center"
                />

              </div>

            </div>


            <div className="form-field">

              <label>
                Update Note
                <span className="optional">Optional</span>
              </label>

              <textarea
                value={note}
                onChange={(event) =>
                  setNote(event.target.value)
                }
                placeholder="Add a short update for the customer..."
                rows="4"
              />

            </div>


            <div className="update-footer">

              <div className="update-preview">

                <span className="preview-dot"></span>

                <div>
                  <strong>{status}</strong>

                  {location && (
                    <small>{location}</small>
                  )}

                  {note && (
                    <p>{note}</p>
                  )}

                  <time>
                    {new Date().toLocaleString([], {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </time>
                </div>

              </div>


              <button
                className="update-button"
                onClick={handleUpdate}
              >
                Update Shipment
                <span>→</span>
              </button>

            </div>

          </div>

        </div>

      </section>

    </main>
  );
}

export default Admin;