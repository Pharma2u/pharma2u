import {
  configureStore,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
export type AuthSession = {
  token: string;
  role: string;
  name: string;
  mustChangePassword: boolean;
};
const authSlice = createSlice({
  name: "auth",
  initialState: { session: null as AuthSession | null },
  reducers: {
    setSession: (state, action: PayloadAction<AuthSession>) => {
      state.session = action.payload;
    },
    clearSession: (state) => {
      state.session = null;
    },
  },
});
export const { setSession, clearSession } = authSlice.actions;
export const authStore = configureStore({
  reducer: { auth: authSlice.reducer },
});
export type AuthRootState = ReturnType<typeof authStore.getState>;
