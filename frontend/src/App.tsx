import { useState } from "react";
import "./App.css";

export type Strike = {
  id: number;
  description: string;
  category: string;
  start_date: string;
  end_date: string;
};

const SAMPLE: Strike[] = [
  {
    id: 1,
    description: "Greve dos motoristas de autocarro",
    category: "Transportes",
    start_date: "2026-03-29",
    end_date: "2026-03-30",
  },
  {
    id: 2,
    description: "Paralisação dos enfersmeiros do SNS",
    category: "Saúde",
    start_date: "2026-03-29",
    end_date: "2026-03-29",
  },
];

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
    setStrikes(SAMPLE);
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
