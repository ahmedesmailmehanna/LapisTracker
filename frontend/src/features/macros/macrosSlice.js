import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { api } from "../../api/client";

export const fetchMacros = createAsyncThunk("macros/fetchAll", async () => {
  const data = await api.listMacros();
  return data.results ?? data;
});

export const addMacroLog = createAsyncThunk("macros/add", async (macroLog) => {
  return api.createMacro(macroLog);
});

export const removeMacroLog = createAsyncThunk("macros/remove", async (id) => {
  await api.deleteMacro(id);
  return id;
});

const macrosSlice = createSlice({
  name: "macros",
  initialState: {
    items: [],
    status: "idle", // idle | loading | succeeded | failed
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMacros.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchMacros.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchMacros.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      .addCase(addMacroLog.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(removeMacroLog.fulfilled, (state, action) => {
        state.items = state.items.filter((m) => m.id !== action.payload);
      });
  },
});

export default macrosSlice.reducer;

export const selectAllMacros = (state) => state.macros.items;
export const selectMacrosStatus = (state) => state.macros.status;
