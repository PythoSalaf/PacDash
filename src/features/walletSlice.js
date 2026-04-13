import { createSlice } from "@reduxjs/toolkit";

const walletSlice = createSlice({
  name: "wallet",
  initialState: {
    address: null,       // string | null
    connected: false,
    // When Privy is integrated, store provider type here
    providerType: null,  // "phantom" | "privy" | "manual"
  },
  reducers: {
    connectWallet: (state, action) => {
      state.address = action.payload.address;
      state.connected = true;
      state.providerType = action.payload.providerType ?? "manual";
    },
    disconnectWallet: (state) => {
      state.address = null;
      state.connected = false;
      state.providerType = null;
    },
  },
});

export const { connectWallet, disconnectWallet } = walletSlice.actions;
export const selectWallet = (state) => state.wallet;
export default walletSlice.reducer;
