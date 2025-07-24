import { createSlice } from "@reduxjs/toolkit";

interface Istate {
  count: number;
}
const initialState = {
  count: 1,
};

const homeSlice = createSlice({
  name: "homeSlice",
  initialState,
  reducers: {
    addCountAction(state, { payload }) {
      state.count += payload;
    },
  },
});

export const { addCountAction } = homeSlice.actions;

export default homeSlice.reducer;
