/**
 * Adapt field form data to API expected format
 * Fixes 400 Bad Request errors
 */

export interface ApiFieldData {
  name: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  area: number; // in hectares
  soilType?: string;
  crops: string[];
  status: 'active' | 'fallow' | 'preparation' | 'harvested';
  irrigationSource: 'rainfed' | 'canal' | 'well' | 'borewell' | 'pond' | 'river' | 'other';
  irrigationSystem: 'flood' | 'drip' | 'sprinkler' | 'none' | 'other';
}

// Helper function to map irrigation system types
function mapIrrigationSystem(system: string): 'flood' | 'drip' | 'sprinkler' | 'none' | 'other' {
  switch (system?.toLowerCase()) {
    case 'drip':
      return 'drip';
    case 'sprinkler':
      return 'sprinkler';
    case 'surface irrigation':
      return 'flood';
    case 'subsurface irrigation':
      return 'other';
    case 'none':
      return 'none';
    default:
      return 'other';
  }
}

export const adaptFieldData = (formData: any): ApiFieldData => {
  // Convert form data to API format
  const lat = parseFloat(formData.coordinates?.latitude) || 0;
  const lon = parseFloat(formData.coordinates?.longitude) || 0;
  
  return {
    name: formData.name || '',
    location: {
      type: 'Point',
      coordinates: [lon, lat] // [longitude, latitude]
    },
    area: parseFloat(formData.area) || 0,
    soilType: formData.soilType || undefined,
    crops: [],
    status: 'active',
    irrigationSource: 'rainfed',
    irrigationSystem: mapIrrigationSystem(formData.irrigationType)
  };
};

// Usage example:
// const apiData = adaptFieldData(formData);
// await dispatch(createFields(apiData));