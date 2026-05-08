function SummaryCard({ title, value, subtitle }) {
  return (
    // Reusable summary card for dashboard metrics.
    <div className="card dashboard-summary-card h-100 border-0 shadow-sm">
      <div className="card-body">
        <p className="summary-title mb-2">{title}</p>
        <h3 className="summary-value mb-2">{value}</h3>
        <p className="summary-subtitle mb-0">{subtitle}</p>
      </div>
    </div>
  );
}

export default SummaryCard;
