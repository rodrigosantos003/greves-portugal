const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export async function fetchAPI(endpoint: string) {
  const response = await fetch(`${BASE_URL}${endpoint}`);
  return response.json();
}
