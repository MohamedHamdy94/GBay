export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/v1";

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const url = `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  return fetch(url, options);
}
