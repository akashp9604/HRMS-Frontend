import React from "react";

export default function StatCard({ title, value, subtitle, color }) {
  return (
    <div className="card shadow-sm p-3">
      <h6 className="text-muted">{title}</h6>
      <h3 style={{ color: color }}>{value}</h3>
      {subtitle && <p className="text-muted">{subtitle}</p>}
    </div>
  );
}
