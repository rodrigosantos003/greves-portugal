import type { Strike } from "../types";
import { formatDate } from "../lib/utils";

export function StrikeCard({ strike, idx }: { strike: Strike; idx: number }) {
  return (
    <div className="gp-card" style={{ animationDelay: `${idx * 60}ms` }}>
      <div className="gp-card-row1">
        <h2>{strike.description}</h2>
      </div>
      <span className="gp-badge">{strike.sector}</span>
      <div className="gp-dates">
        {strike.strikeDates
          .map((date) => formatDate(date.toISOString()))
          .join(" → ")}
      </div>
    </div>
  );
}
