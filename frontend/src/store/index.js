import { createSlice, createAsyncThunk, configureStore } from '@reduxjs/toolkit'
import { authAPI } from '../api.js'

// ─── Thunks ───────────────────────────────────────────────────────────────────
export const login = createAsyncThunk('auth/login', async (creds, { rejectWithValue }) => {
  try {
    const { data } = await authAPI.login(creds)
    localStorage.setItem('accessToken',  data.data.accessToken)
    localStorage.setItem('refreshToken', data.data.refreshToken)
    return data.data
  } catch (e) { return rejectWithValue(e.response?.data?.message || 'Login failed') }
})

export const register = createAsyncThunk('auth/register', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await authAPI.register(payload)
    localStorage.setItem('accessToken',  data.data.accessToken)
    localStorage.setItem('refreshToken', data.data.refreshToken)
    return data.data
  } catch (e) { return rejectWithValue(e.response?.data?.message || 'Registration failed') }
})

export const getMe = createAsyncThunk('auth/getMe', async (_, { rejectWithValue }) => {
  try {
    const { data } = await authAPI.getMe()
    return data.data
  } catch (e) { return rejectWithValue(e.response?.data?.message) }
})

export const logout = createAsyncThunk('auth/logout', async () => {
  try { await authAPI.logout() } catch {}
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
})

// ─── Slice ────────────────────────────────────────────────────────────────────
const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, loading: false, error: null, initialized: false },
  reducers: { clearError: s => { s.error = null },
  setInitialized: s => { s.initialized = true },
 },
  extraReducers: b => {
    const pending   = s => { s.loading = true;  s.error = null }
    const fulfilled = (s, { payload }) => { s.loading = false; s.user = payload.user; s.initialized = true }
    const rejected  = (s, { payload }) => { s.loading = false; s.error = payload }

    b.addCase(login.pending,    pending)
    b.addCase(login.fulfilled,  fulfilled)
    b.addCase(login.rejected,   rejected)
    b.addCase(register.pending,   pending)
    b.addCase(register.fulfilled, fulfilled)
    b.addCase(register.rejected,  rejected)
    b.addCase(getMe.fulfilled, (s, { payload }) => { s.user = payload.user; s.initialized = true })
    b.addCase(getMe.rejected,  s => { s.initialized = true })
    b.addCase(getMe.pending, s => { s.initialized = false })
    b.addCase(logout.fulfilled, s => { s.user = null; s.initialized = true })
  }
})

export const { clearError } = authSlice.actions

// ─── Store ────────────────────────────────────────────────────────────────────
export const store = configureStore({ reducer: { auth: authSlice.reducer, } })
