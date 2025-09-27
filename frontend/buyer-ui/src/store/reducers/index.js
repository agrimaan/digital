import { combineReducers } from 'redux';
import authReducer from './authReducer';
import uiReducer from './uiReducer';

const rootReducer = combineReducers({
  auth: authReducer,
  ui: uiReducer,
  // Add more reducers here
});

export default rootReducer;
