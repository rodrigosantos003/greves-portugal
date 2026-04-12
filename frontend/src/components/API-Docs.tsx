import { ApiReferenceReact } from "@scalar/api-reference-react";
import "@scalar/api-reference-react/style.css";

const specUrl = `${import.meta.env.VITE_API_URL}/openapi.json`;

export function ApiDocsPage() {
  return (
    <ApiReferenceReact
      configuration={{
        url: specUrl,
      }}
    />
  );
}
