const fs = require('fs');

// Read the file
let content = fs.readFileSync('frontend/src/pages/farmer/EditField.tsx', 'utf8');

// Replace the updatedField object
const oldPattern = /const updatedField = \{[\s\S]*?\};/;
const newUpdatedField = `const updatedField = {
        name: formData.name,
        area: parseFloat(formData.area),
        location: {
          type: 'Point' as const,
          coordinates: [
            Number(formData.coordinates.longitude) || 0,
            Number(formData.coordinates.latitude) || 0,
          ]
        },
        soilType: denormalizeSoilType(formData.soilType),
        crops: [],
        status: 'active' as const,
        irrigationSource: 'rainfed' as const,
        irrigationSystem: mapIrrigationSystem(formData.irrigationType)
      };`;

content = content.replace(oldPattern, newUpdatedField);

// Write the file back
fs.writeFileSync('frontend/src/pages/farmer/EditField.tsx', content);
console.log('Fixed EditField.tsx');