// src/store.ts
import { configureStore } from '@reduxjs/toolkit';

// existing reducers (you already have these in your app)
import authReducer from './features/auth/authSlice';
import fieldsReducer from './features/fields/fieldSlice';
import cropReducer from './features/crops/cropSlice';
import sensorReducer from './features/sensors/sensorSlice';
import analyticsReducer from './features/analytics/analyticsSlice';
import weatherReducer from './features/weather/weatherSlice';
import alertReducer from './features/alert/alertSlice';
import orderReducer from './features/orders/orderSlice';
import marketplaceReducer from './features/marketplace/marketplaceSlice';

// new reducers we added
import trustReducer from './features/trustLedger/trustLedgerSlice';
import resourcesReducer from './features/resources/resourcesSlice';
import sustainabilityReducer from './features/sustainability/sustainabilitySlice';
import matchReducer from './features/matchmaking/matchmakingSlice';

export const store = configureStore({
  reducer: {
    // existing
    auth: authReducer,
    fields: fieldsReducer,
    crop: cropReducer,
    sensor: sensorReducer,
    analytics: analyticsReducer,
    weather: weatherReducer,
    alert: alertReducer,
    order: orderReducer,
    marketplace: marketplaceReducer,
    trust: trustReducer,
    resources: resourcesReducer,
    sustainability: sustainabilityReducer,
    match: matchReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
