// src/types/domain.ts
export interface Field { _id: string; name: string; crops: string[]; location?: { type?: string } }
export interface Crop { _id: string; status: 'planned'|'planted'|'growing'|'harvested'|'failed' }
export interface Sensor { _id: string; status: 'active'|'inactive'|'maintenance'|'error' }
export interface Recommendation { type: string; message?: string }
export interface AlertItem { id: string; message: string; severity?: 'info'|'success'|'warning'|'error'; timeout?: number }
