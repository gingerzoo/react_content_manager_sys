import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getPageMenus, getPageDepartments, getPageRoles } from '@/service/main/main';

interface Istate {
    selectedKeys: string[];
    pageRoles: any[];
    pageDepartments: any[];
    pageMenus: any[];
}
const initialState: Istate = {
    selectedKeys: [],
    pageRoles: [],
    pageDepartments: [],
    pageMenus: []
};

export const fetchPageEntriesAction = createAsyncThunk('system/roles', async (_, { dispatch }) => {
    // 并行请求所有接口
    const [menusRes, rolesRes, departmentsRes] = await Promise.all([
        getPageMenus(),
        getPageRoles(),
        getPageDepartments()
    ]);
    dispatch(changePageMenusAction(menusRes.data.list));
    dispatch(changePageRolesAction(rolesRes.data.list));
    dispatch(changePageDepartmentAction(departmentsRes.data.list));
});

const homeSlice = createSlice({
    name: 'homeSlice',
    initialState,
    reducers: {
        changeSelectedKeysAction(state, { payload }) {
            state.selectedKeys = payload;
        },
        changePageRolesAction(state, { payload }) {
            state.pageRoles = payload;
        },
        changePageDepartmentAction(state, { payload }) {
            state.pageDepartments = payload;
        },
        changePageMenusAction(state, { payload }) {
            state.pageMenus = payload;
        }
    }
});

export const {
    changeSelectedKeysAction,
    changePageDepartmentAction,
    changePageMenusAction,
    changePageRolesAction
} = homeSlice.actions;

export default homeSlice.reducer;
