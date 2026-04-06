const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export async function getStrikes() {
  const response = await fetch(`${BASE_URL}/strikes`);
  return response.json();
}
