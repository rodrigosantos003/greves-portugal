import { useState } from "react";
import "./styles/App.css";
import { fetchAPI } from "./lib/api";
import { StrikeCard } from "./components/Card";
import { useQuery } from "@tanstack/react-query";
import type { Strike } from "./types";

function App() {
  const [visible, setVisible] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["strikes"],
    queryFn: () => fetchAPI("/strikes"),
    enabled: visible,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    retry: false,
  });

  const { data: futureData, isLoading: futureIsLoading } = useQuery({
    queryKey: ["futureStrikes"],
    queryFn: () => fetchAPI("/strikes/future"),
    enabled: visible,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    retry: false,
  });

  return (
    <>
      <div style={{ position: "relative" }}>
        <div className="gp-title-row">
          <h1 className="gp-title">Outra vez em greve?</h1>
          <img src="/icons8-portugal-48.png" alt="Portugal" />
        </div>
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
            ) : !data?.strikes || data?.strikes.length === 0 ? (
              <p className="gp-empty">Sem greves registadas para hoje.</p>
            ) : (
              data.strikes.map((strike: Strike, i: number) => (
                <StrikeCard key={strike._id} strike={strike} idx={i} />
              ))
            )}
          </div>
        )}
      </div>
      {visible && (
        <div style={{ marginTop: "2rem" }}>
          <h2 style={{ textAlign: "center", marginTop: "2rem" }}>
            Próximas greves:
          </h2>

          <div className="gp-list">
            {futureIsLoading ? (
              <p className="gp-empty">A carregar...</p>
            ) : !futureData?.strikes || futureData?.strikes.length === 0 ? (
              <p className="gp-empty">Sem greves próximas.</p>
            ) : (
              futureData.strikes.map((strike: Strike, i: number) => (
                <StrikeCard key={strike._id} strike={strike} idx={i} />
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default App;
