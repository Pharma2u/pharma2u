import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type AuthSession = {
  token: string;
  role: "customer" | "vendor" | "rider" | "admin";
  name: string;
  mustChangePassword: boolean;
};

type AuthState = { session: AuthSession | null };
const initialState: AuthState = { session: null };

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSession: (state, action: PayloadAction<AuthSession>) => {
      state.session = action.payload;
    },
    markPasswordChanged: (state) => {
      if (state.session) state.session.mustChangePassword = false;
    },
    clearSession: (state) => {
      state.session = null;
    },
  },
});

export const { clearSession, markPasswordChanged, setSession } =
  authSlice.actions;
export default authSlice.reducer;
