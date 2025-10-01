import { combineReducers } from 'redux';
import authReducer from './authReducer';
import uiReducer from './uiReducer';
import contentReducer from './contentReducer';
import userReducer from './userReducer';
import analyticsReducer from './analyticsReducer';
import auditReducer from './auditReducer';
import notificationReducer from './notificationReducer';

const rootReducer = combineReducers({
  auth: authReducer,
  ui: uiReducer,
  content: contentReducer,
  user: userReducer,
  analytics: analyticsReducer,
  audit: auditReducer,
  notifications: notificationReducer
});

export default rootReducer;
