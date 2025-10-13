// Import the exact types from fieldSlice to ensure compatibility
import { Fields as FieldSliceFields } from '../features/fields/fieldSlice';

export interface FieldFormData {
  name: string;
  location: {
    latitude: number;
    longitude: number;
    name: string;
  };
  area: number;
  areaUnit: string;
  soilType: string;
  irrigationType: string;
  boundaries: string;
  description: string;
}

export const fieldDataFormatter = {
  formatFieldDataForBackend: (formData: FieldFormData): Partial<FieldSliceFields> => {
    return {
      name: formData.name,
      location: {
        type: 'Point',
        coordinates: [formData.location.longitude, formData.location.latitude]
      },
      area: formData.area,
      soilType: formData.soilType,
      irrigationType: mapIrrigationSystem(formData.irrigationType),
      status: 'active',
      crops: []
    };
  },

  validateFieldData: (formData: FieldFormData): boolean => {
    return !!(
      formData.name &&
      formData.location.latitude &&
      formData.location.longitude &&
      formData.area > 0 &&
      formData.soilType &&
      formData.irrigationType
    );
  }
};

// Helper function to map irrigation system types
function mapIrrigationSystem(system: string): 'flood' | 'drip' | 'sprinkler' | 'none' | 'other' {
  switch (system) {
    case 'drip':
    case 'sprinkler':
      return system as 'drip' | 'sprinkler';
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