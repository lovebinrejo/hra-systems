import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { User, AuthTokens } from '../types';
import { authService } from '../services/authService';

interface AuthState {
  user: User | null;
  access: string | null;
  refresh: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  access: localStorage.getItem('access_token'),
  refresh: localStorage.getItem('refresh_token'),
  loading: false,
  error: null,
};

export const loginThunk = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const res = await authService.login(email, password);
      return res.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

export const logoutThunk = createAsyncThunk(
  'auth/logout',
  async (_, { getState }) => {
    const state = getState() as { auth: AuthState };
    if (state.auth.refresh) {
      try {
        await authService.logout(state.auth.refresh);
      } catch {
        // ignore
      }
    }
  }
);

export const fetchMeThunk = createAsyncThunk(
  'auth/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      const res = await authService.getMe();
      return res.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<AuthTokens>) => {
      state.access = action.payload.access;
      state.refresh = action.payload.refresh;
      state.user = action.payload.user;
      localStorage.setItem('access_token', action.payload.access);
      localStorage.setItem('refresh_token', action.payload.refresh);
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    logout: (state) => {
      state.user = null;
      state.access = null;
      state.refresh = null;
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.access = action.payload.access;
        state.refresh = action.payload.refresh;
        state.user = action.payload.user;
        localStorage.setItem('access_token', action.payload.access);
        localStorage.setItem('refresh_token', action.payload.refresh);
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.user = null;
        state.access = null;
        state.refresh = null;
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      })
      .addCase(fetchMeThunk.fulfilled, (state, action) => {
        state.user = action.payload;
      });
  },
});

export const { setCredentials, setUser, logout, clearError } = authSlice.actions;
export default authSlice.reducer;
