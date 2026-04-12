import { useState } from "react";
import "../styles/App.css";
import { fetchAPI } from "../lib/api";
import { StrikeCard } from "../components/Card";
import { useQueries } from "@tanstack/react-query";
import type { Strike } from "../types";

type StrikeView = "all" | "today" | "future";

export function Home() {
  const [strikeView, setStrikeView] = useState<StrikeView>("all");

  const [currentStrikes, futureStrikes] = useQueries({
    queries: [
      {
        queryKey: ["currentStrikes"],
        queryFn: () => fetchAPI("/strikes"),
        staleTime: 1000 * 60 * 60 * 24, // 24 hours
        retry: false,
      },
      {
        queryKey: ["futureStrikes"],
        queryFn: () => fetchAPI("/strikes/future"),
        staleTime: 1000 * 60 * 60 * 24, // 24 hours
        retry: false,
      },
    ],
  });

  const listLoading =
    strikeView === "today"
      ? currentStrikes?.isLoading
      : futureStrikes?.isLoading;

  const listStrikes =
    strikeView === "today"
      ? currentStrikes?.data?.strikes
      : futureStrikes?.data?.strikes;
  const emptyMessage =
    strikeView === "today"
      ? "Sem greves registadas para hoje."
      : "Sem greves próximas.";

  return (
    <>
      <nav className="gp-nav gp-nav-top" aria-label="Tipo de greves">
        <div className="gp-nav-inner">
          <div className="gp-nav-brand">
            <img
              src="/greves-portugal-logo.svg"
              alt="Portugal"
              width={60}
              height={60}
              className="gp-nav-logo"
            />
            <span className="gp-nav-label">Greves Portugal</span>
          </div>
          <div
            className="gp-nav-tabs"
            role="tablist"
            aria-label="Atuais ou futuras"
          >
            <button
              type="button"
              role="tab"
              aria-selected={strikeView === "all"}
              className={
                strikeView === "all"
                  ? "gp-nav-tab gp-nav-tab-active"
                  : "gp-nav-tab"
              }
              onClick={() => setStrikeView("all")}
            >
              Todas
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={strikeView === "today"}
              className={
                strikeView === "today"
                  ? "gp-nav-tab gp-nav-tab-active"
                  : "gp-nav-tab"
              }
              onClick={() => setStrikeView("today")}
            >
              Para hoje
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={strikeView === "future"}
              className={
                strikeView === "future"
                  ? "gp-nav-tab gp-nav-tab-active"
                  : "gp-nav-tab"
              }
              onClick={() => setStrikeView("future")}
            >
              Futuras
            </button>
          </div>
        </div>
      </nav>
      <div className="gp-main" style={{ position: "relative" }}>
        <div className="gp-title-row">
          <h1 className="gp-title">Outra vez em greve?</h1>
        </div>
        <div className="gp-list" role="tabpanel">
          {listLoading ? (
            <p className="gp-empty">A carregar...</p>
          ) : !listStrikes || listStrikes.length === 0 ? (
            <p className="gp-empty">{emptyMessage}</p>
          ) : (
            listStrikes.map((strike: Strike, i: number) => (
              <StrikeCard key={strike._id} strike={strike} idx={i} />
            ))
          )}
        </div>
      </div>
    </>
  );
}
