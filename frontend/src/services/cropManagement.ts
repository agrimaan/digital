import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:3000";

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Fetch crop reference list (for autocomplete)
export const fetchRefCrops = async (query: string) => {
  const res = await axios.get(`${API_BASE_URL}/api/ref/crops`, {
    params: { name: query },
    headers: authHeaders(),
  });
  return Array.isArray(res.data?.data) ? res.data.data : [];
};

// Fetch varieties for a specific crop
export const fetchRefVarieties = async (cropSlug: string) => {
  const res = await axios.get(`${API_BASE_URL}/api/ref/varieties`, {
    params: { crop: cropSlug },
    headers: authHeaders(),
  });
  return (Array.isArray(res.data?.data) ? res.data.data : []).map(
    (v: any) => v.name
  );
};
