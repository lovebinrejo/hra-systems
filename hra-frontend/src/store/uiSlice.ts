import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  sidebarOpen: boolean;
  unreadNotifications: number;
}

const initialState: UIState = {
  sidebarOpen: false,
  unreadNotifications: 0,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    setUnreadNotifications: (state, action: PayloadAction<number>) => {
      state.unreadNotifications = action.payload;
    },
  },
});

export const { toggleSidebar, setSidebarOpen, setUnreadNotifications } = uiSlice.actions;
export default uiSlice.reducer;
