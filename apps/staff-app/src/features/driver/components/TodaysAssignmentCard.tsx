

function TodaysAssignmentCard() {
  return (
    <div className="assignment-card">

      {/* Header */}
      <div className="card-header">
        <h3>Today's Assignment</h3>
        <span className="status active">● Active</span>
      </div>

      {/* Content Grid */}
      <div className="assignment-grid">

        <div className="item">
          <label>Bus Number</label>
          <p>SBTS-BUS-114</p>
        </div>

        <div className="item">
          <label>Plate Number</label>
          <p>3-81254 AA</p>
        </div>

        <div className="item">
          <label>Route</label>
          <p>Route 12 — Megenagna → Bole</p>
        </div>

        <div className="item">
          <label>Shift Time</label>
          <p>06:30 – 14:30</p>
        </div>

        <div className="item">
          <label>Trip ID</label>
          <p>TRP-2025-0917</p>
        </div>

        <div className="item">
          <label>Bus Model</label>
          <p>Yutong ZK6118HGR</p>
        </div>

      </div>
    </div>
  );
}

export default TodaysAssignmentCard;