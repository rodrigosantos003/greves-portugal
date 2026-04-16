import { ApiReferenceReact } from "@scalar/api-reference-react";
import "@scalar/api-reference-react/style.css";
import { Helmet } from "react-helmet-async";

const specUrl = `${import.meta.env.VITE_API_URL}/openapi.json`;

export function ApiDocsPage() {
  return (
    <>
      <Helmet>
        <title>Greves Portugal | API Documentation</title>
        <meta name="description" content="Greves Portugal API Documentation" />
      </Helmet>
      <ApiReferenceReact
        configuration={{
          url: specUrl,
        }}
      />
    </>
  );
}
