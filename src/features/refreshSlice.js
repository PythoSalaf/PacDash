import { createSlice } from "@reduxjs/toolkit";

// Single counter — incrementing it triggers all components watching it to refetch
const refreshSlice = createSlice({
  name: "refresh",
  initialState: { tick: 0, lastRefreshed: null },
  reducers: {
    triggerRefresh: (state) => {
      state.tick += 1;
      state.lastRefreshed = Date.now();
    },
  },
});

export const { triggerRefresh } = refreshSlice.actions;
export const selectRefreshTick = (s) => s.refresh.tick;
export const selectLastRefreshed = (s) => s.refresh.lastRefreshed;
export default refreshSlice.reducer;
