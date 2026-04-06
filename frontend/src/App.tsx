import { useState } from "react";
import "./styles/App.css";
import { getStrikes } from "./lib/api";
import { StrikeCard } from "./components/Card";
import { useQuery } from "@tanstack/react-query";
import type { Strike } from "./types";

function App() {
  const [visible, setVisible] = useState(false);

  const { data: strikes, isLoading } = useQuery({
    queryKey: ["strikes"],
    queryFn: getStrikes,
    enabled: visible,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    retry: false,
  });

  return (
    <div style={{ position: "relative" }}>
      <h1 className="gp-title">Outra vez em greve? 🇵🇹</h1>
      <div className="gp-btn-row">
        <button
          type="button"
          className="gp-btn gp-btn-refresh"
          onClick={() => setVisible(true)}
        >
          🤔 Ver greves de hoje
        </button>
      </div>
      {visible && (
        <div className="gp-list">
          {isLoading ? (
            <p className="gp-empty">A carregar...</p>
          ) : strikes.length === 0 ? (
            <p className="gp-empty">Sem greves registadas para hoje.</p>
          ) : (
            strikes.map((s: Strike, i: number) => (
              <StrikeCard key={s.id} strike={s} idx={i} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default App;
