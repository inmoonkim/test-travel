const BASE_URL = "https://serpapi.com/search.json";

export async function serpApiGet(
  params: Record<string, string | number>
): Promise<unknown> {
  const url = new URL(BASE_URL);
  url.searchParams.set("api_key", process.env.SERPAPI_KEY ?? "");
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`SerpAPI ${res.status}: ${await res.text()}`);
  return res.json();
}
