import { useState, useEffect } from "react";
import "../styles/Incident.css";

function IncidentPage({ incidents, setIncidents, setNotifications }: any) {

  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // 📍 GET GPS LOCATION
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = `${position.coords.latitude}, ${position.coords.longitude}`;
          setLocation(coords);
        },
        () => {
          setLocation("Location not available");
        }
      );
    } else {
      setLocation("Geolocation not supported");
    }
  }, []);

  // 🚀 SUBMIT INCIDENT
  const handleSubmit = () => {
    if (!type) {
      setError("Please select an incident type");
      return;
    }

    if (!description) {
      setError("Please enter description");
      return;
    }

    if (!location) {
      setError("Location not ready yet");
      return;
    }

    const newIncident = {
      id: Date.now(),
      type,
      description,
      location,
      time: new Date().toLocaleString(),
      status: "Reported",
    };

    // ✅ SAVE INCIDENT (FIXED)
    setIncidents((prev: any[]) => [newIncident, ...prev]);

    // 🔔 ADD NOTIFICATION
    setNotifications((prev: any[]) => [
      {
        id: Date.now(),
        message: "New incident reported: " + type,
        time: "Just now",
        read: false,
      },
      ...prev,
    ]);

    // ✅ RESET FORM
    setType("");
    setDescription("");
    setError("");
    setSuccess(true);
  };

  return (
    <div className="incident-container">
      <div className="incident-card">

        {success ? (
          <div className="success-box">
            <h3>✅ Report Submitted</h3>
            <p>Your incident has been successfully reported.</p>
            <p><strong>Status:</strong> Reported</p>

            <button className="submit-btn" onClick={() => setSuccess(false)}>
              Submit Another
            </button>
          </div>
        ) : (
          <>
            <h3 className="title">Report Incident</h3>

            {/* TYPE */}
            <label>Incident Type</label>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setError("");
              }}
            >
              <option value="">Select type</option>
              <option>Breakdown</option>
              <option>Accident</option>
              <option>Delay</option>
              <option>Other</option>
            </select>

            {/* DESCRIPTION */}
            <label>Description</label>
            <textarea
              placeholder="Describe the issue..."
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setError("");
              }}
            />

            {/* ERROR */}
            {error && <p className="error">{error}</p>}

            {/* AUTO INFO */}
            <div className="incident-info">
              <p><strong>Time:</strong> {new Date().toLocaleString()}</p>
              <p><strong>Location:</strong> {location || "Fetching..."}</p>
            </div>

            <button className="submit-btn" onClick={handleSubmit}>
              Submit Report
            </button>
          </>
        )}

        {/* 🧾 INCIDENT LIST (BONUS 🔥) */}
        {incidents.length > 0 && (
          <div className="incident-list">
            <h4>Recent Reports</h4>

            {incidents.map((i: any) => (
              <div key={i.id} className="incident-item">
                <p><strong>{i.type}</strong> - {i.status}</p>
                <span>{i.time}</span>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

export default IncidentPage;