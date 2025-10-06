export type Role = 'farmer'|'buyer'|'admin'|'logistics'|'agronomist'|'investor';
export type LedgerType =
  | 'ORDER'
  | 'DELIVERY'
  | 'QUALITY_CHECK'
  | 'DISPUTE'
  | 'SUSTAINABILITY';
  
  export type resourceType =
  'tractor'
  |'cold_storage'
  |'warehouse'
  |'transport'
  |'thresher'
  |'other'
  
export interface User {
  id: string;
  role: Role;
  name: string;
  phone?: string;
  region?: string;
}

export interface TrustMetric {
  onTimeDelivery: number;       // 0..100
  qualityConsistency: number;   // 0..100
  disputeRate: number;          // 0..100 (lower is better; invert on UI)
  sustainabilityScore: number;  // 0..100
}

export interface LedgerEntry {
  id: string;
  userId: string;
  type: LedgerType;     // ✅ use the union, not string
  delta: number;
  meta?: Record<string, any>;
  createdAt: string;
}

export interface TrustProfile {
  userId: string;
  score: number;       // 0..100 composite
  metrics: TrustMetric;
  history: LedgerEntry[];
}

/** Community Resources */
export interface Resource {
  id: string;
  type: resourceType;
  name: string;
  ownerType: 'coop'|'farmer'|'third_party';
  location: string;
  hourlyRate: number;
  available: boolean;
}

export interface Booking {
  id: string;
  resourceId: string;
  requesterId: string;
  start: string; // ISO
  end: string;   // ISO
  price: number;
  status: 'pending'|'confirmed'|'completed'|'cancelled';
}

/** Sustainability & Green Points */
export interface SustainabilityAction {
  id: string;
  userId: string;
  action:
    | 'reduced_water_use'
    | 'organic_input'
    | 'crop_rotation'
    | 'soil_test'
    | 'solar_pump'
    | 'low_emission_transport';
  points: number;
  verifiedBy?: string; // userId or org
  createdAt: string;
}

export interface PointsSummary {
  userId: string;
  totalPoints: number;
  carbonCredits: number; // derived (e.g., points/1000)
  actions: SustainabilityAction[];
}

/** AI Market Matchmaking */
export interface MatchRecommendation {
  id: string;
  farmerId: string;
  buyerId: string;
  crop: string;
  score: number; // 0..1
  reasons: string[];
}

