import { useState } from "react";
import "./App.css";

export type Strike = {
  id: number;
  description: string;
  category: string;
  start_date: string;
  end_date: string;
};

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

function formatDate(d: string) {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

function StrikeCard({ strike, idx }: { strike: Strike; idx: number }) {
  return (
    <div className="gp-card" style={{ animationDelay: `${idx * 60}ms` }}>
      <div className="gp-card-row1">
        <h2>{strike.description}</h2>
      </div>
      <span className="gp-badge">{strike.category}</span>
      <div className="gp-dates">
        {formatDate(strike.start_date)} → {formatDate(strike.end_date)}
      </div>
    </div>
  );
}

function App() {
  const [strikes, setStrikes] = useState<Strike[]>([]);
  const [visible, setVisible] = useState(false);

  const loadStrikes = () => {
    fetch(`${BASE_URL}/strikes`)
      .then((res) => res.json())
      .then((data) => setStrikes(data.data as Strike[]))
      .catch((err) => console.error(err));
    setVisible(true);
  };

  return (
    <div style={{ position: "relative" }}>
      <h1 className="gp-title">Outra vez em greve? 🇵🇹</h1>
      <div className="gp-btn-row">
        <button
          type="button"
          className="gp-btn gp-btn-refresh"
          onClick={loadStrikes}
        >
          🤔 Ver greves de hoje
        </button>
      </div>
      {visible && (
        <div className="gp-list">
          {strikes.length === 0 ? (
            <p className="gp-empty">Sem greves registadas para hoje.</p>
          ) : (
            strikes.map((s, i) => <StrikeCard key={s.id} strike={s} idx={i} />)
          )}
        </div>
      )}
    </div>
  );
}

export default App;
