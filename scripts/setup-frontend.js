// Frontend setup script
const fs = require('fs');
const path = require('path');

const frontendApps = [
  'frontend/admin-ui',
  'frontend/farmer-ui',
  'frontend/buyer-ui',
  'frontend/mobile-app'
];

frontendApps.forEach(app => {
  const configPath = path.join(app, 'src/config/api.js');
  const config = `
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
  ENDPOINTS: {
    AUTH: '/auth',
    USERS: '/users',
    FIELDS: '/fields',
    CROPS: '/crops',
    MARKETPLACE: '/marketplace'
  }
};
`;
  
  if (fs.existsSync(app)) {
    fs.writeFileSync(configPath, config);
    console.log(`✅ Updated ${app} API configuration`);
  }
});
