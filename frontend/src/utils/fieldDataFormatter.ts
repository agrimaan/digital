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
  irrigationSystem: string;
  boundaries: string;
  description: string;
}

export const fieldDataFormatter = {
  formatFieldDataForBackend: (formData: FieldFormData): Partial<FieldSliceFields> => {
    return {
      name: formData.name,
      location: {
        type: 'Point',
        coordinates: [formData.location.longitude, formData.location.latitude],
        name: formData.location.name
      },
      boundaries: {
        type: 'Polygon',
        coordinates: JSON.parse(formData.boundaries || '[]')
      },
      area: {
        value: formData.area,
        unit: formData.areaUnit as 'hectare' | 'acre'
      },
      soilType: formData.soilType as 'clay' | 'sandy' | 'loamy' | 'silty' | 'peaty' | 'chalky' | 'other',
      irrigationSystem: {
        type: formData.irrigationSystem as 'drip' | 'sprinkler' | 'surface irrigation' | 'subsurface irrigation' | 'none',
        isAutomated: false
      }
    };
  },

  validateFieldData: (formData: FieldFormData): boolean => {
    return !!(
      formData.name &&
      formData.location.latitude &&
      formData.location.longitude &&
      formData.area > 0 &&
      formData.soilType &&
      formData.irrigationSystem
    );
  }
};