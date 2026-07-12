import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
export type Session = {
  token: string;
  role: string;
  name: string;
  mustChangePassword: boolean;
};
const authSlice = createSlice({
  name: "auth",
  initialState: { session: null as Session | null },
  reducers: {
    setSession: (state, action: PayloadAction<Session>) => {
      state.session = action.payload;
    },
    clearSession: (state) => {
      state.session = null;
    },
    passwordChanged: (state) => {
      if (state.session) state.session.mustChangePassword = false;
    },
  },
});
export const { setSession, clearSession, passwordChanged } = authSlice.actions;
export default authSlice.reducer;
