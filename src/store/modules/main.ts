import { createSlice } from '@reduxjs/toolkit';

interface Istate {
    selectedKeys: string[];
}
const initialState: Istate = {
    selectedKeys: []
};

const homeSlice = createSlice({
    name: 'homeSlice',
    initialState,
    reducers: {
        changeSelectedKeys(state, { payload }) {
            state.selectedKeys = payload;
        }
    }
});

export const { changeSelectedKeys } = homeSlice.actions;

export default homeSlice.reducer;
