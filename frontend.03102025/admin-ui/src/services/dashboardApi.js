import api from './api';

export async function getDashboardData() {
const { data } = await api.get('/dashboards')
return data?.data || data || null
}