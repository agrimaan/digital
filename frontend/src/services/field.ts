export interface GeoSuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

export async function searchNominatim(query: string, limit = 5): Promise<GeoSuggestion[]> {
  if (!query.trim()) return [];

  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    query
  )}&limit=${limit}&addressdetails=0`;

  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`Nominatim API error: ${res.status}`);
    return (await res.json()) as GeoSuggestion[];
  } catch (error) {
    console.error("Error fetching from Nominatim:", error);
    return [];
  }
}
