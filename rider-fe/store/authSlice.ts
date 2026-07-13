import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
export type RiderSession = {
  token: string;
  role: "rider";
  name: string;
  mustChangePassword: boolean;
};
type State = { session: RiderSession | null };
const slice = createSlice({
  name: "auth",
  initialState: { session: null } as State,
  reducers: {
    setSession: (state, action: PayloadAction<RiderSession>) => {
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
export const { setSession, clearSession, passwordChanged } = slice.actions;
export default slice.reducer;
