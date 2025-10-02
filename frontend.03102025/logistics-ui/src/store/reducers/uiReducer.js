import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  sidebarOpen: true,
  notifications: [],
  theme: 'light'
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    addNotification: (state, action) => {
      state.notifications.push(action.payload);
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    }
  }
});

export const { 
  toggleSidebar, 
  addNotification, 
  removeNotification, 
  toggleTheme 
} = uiSlice.actions;

export default uiSlice.reducer;
