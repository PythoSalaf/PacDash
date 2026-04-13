import { configureStore } from "@reduxjs/toolkit";
import { pacificaApi } from "../features/pacificaSlice";
import { elfaApi } from "../features/elfaSlice";
import walletReducer from "../features/walletSlice";
import refreshReducer from "../features/refreshSlice";

export const store = configureStore({
  reducer: {
    wallet: walletReducer,
    refresh: refreshReducer,
    [pacificaApi.reducerPath]: pacificaApi.reducer,
    [elfaApi.reducerPath]: elfaApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(pacificaApi.middleware)
      .concat(elfaApi.middleware),
});
