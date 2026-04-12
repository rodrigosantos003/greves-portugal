import { Routes, Route } from "react-router-dom";
import { ApiDocsPage } from "./components/API-Docs";
import { Home } from "./components/Home";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/api-reference" element={<ApiDocsPage />} />
    </Routes>
  );
}

export default App;
