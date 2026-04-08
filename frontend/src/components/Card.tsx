import dayjs from "dayjs";
import type { Strike } from "../types";

export function StrikeCard({ strike, idx }: { strike: Strike; idx: number }) {
  return (
    <div className="gp-card" style={{ animationDelay: `${idx * 60}ms` }}>
      <div className="gp-card-row1">
        <h2>{strike.title}</h2>
      </div>
      <span className="gp-badge">{strike.sector}</span>
      <div className="gp-dates">
        {strike.strikeDates
          .map((date) => dayjs(date).format("DD/MM/YYYY"))
          .join(" → ")}
      </div>
    </div>
  );
}
