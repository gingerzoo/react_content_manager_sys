import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
    getPageListData,
    deletePageItemById,
    createNewPageItem,
    editPageItemInfo
} from '@/service/main/stystem/system';
import type { RootState } from '@/store';

interface Iquery {
    pageName: string;
    queryInfo: any;
    userId?: number;
}
const initialState = {
    pageList: [],
    totalCount: 0,
    pageSize: 8,
    pageOffset: 0
};

// 异步action也要导出啊！！！！
// 获取pagelist的异步action
export const fetchPageListAction = createAsyncThunk(
    'system/fetchList',
    async (data: Iquery, { dispatch, getState, rejectWithValue }) => {
        try {
            console.log('fetchPageListAction---------------data.pageName', data.pageName);
            const result = await getPageListData(data.pageName, data.queryInfo);
            const { list, totalCount } = result.data;
            list && dispatch(changePageListAction(list));
            totalCount && dispatch(changeTotalCountAction(totalCount));
        } catch (err) {
            return rejectWithValue(err);
        }
    }
);

// 编辑某一项信息
export const editPageItemInfoAction = createAsyncThunk<
    void,
    Iquery,
    {
        state: RootState;
    }
>('system/editItem', async (data: Iquery, { dispatch, getState, rejectWithValue }) => {
    try {
        console.log('编辑-------------前');
        await editPageItemInfo(data.pageName, data.userId, data.queryInfo);
        console.log('编辑--------后');

        dispatch(
            fetchPageListAction({
                pageName: data.pageName,
                queryInfo: {
                    offset: getState().system.pageOffset,
                    size: getState().system.pageSize
                }
            })
        );
    } catch (err) {
        console.log('er-------', err);
        return rejectWithValue(err);
    }
});

// 删除某一项的异步action
export const deleteItemByIdAction = createAsyncThunk<
    void,
    Iquery,
    {
        state: RootState;
    }
>('system/deleteItem', async (data: Iquery, { dispatch, getState, rejectWithValue }) => {
    try {
        await deletePageItemById(data.pageName, data.queryInfo);
        dispatch(
            fetchPageListAction({
                pageName: data.pageName,
                queryInfo: {
                    offset: getState().system.pageOffset,
                    size: getState().system.pageSize
                }
            })
        );
    } catch (err) {
        return rejectWithValue(err);
    }
});

// 新增某一项的异步action
export const createNewItemAction = createAsyncThunk<
    void,
    Iquery,
    {
        state: RootState;
    }
>('system/createItem', async (data: Iquery, { dispatch, getState, rejectWithValue }) => {
    try {
        const result = await createNewPageItem(data.pageName, data.queryInfo);

        dispatch(
            fetchPageListAction({
                pageName: data.pageName,
                queryInfo: {
                    offset: getState().system.pageOffset,
                    size: getState().system.pageSize
                }
            })
        );

        console.log('获得列表数据-------', result.data);
    } catch (err) {
        return rejectWithValue(err);
    }
});
const systemSlice = createSlice({
    name: 'system',
    initialState,
    reducers: {
        changePageListAction(state, { payload }) {
            state.pageList = payload;
        },
        changeTotalCountAction(state, { payload }) {
            state.totalCount = payload;
        },
        changePageSizeAction(state, { payload }) {
            state.pageSize = payload;
        },
        changePageOffsetAction(state, { payload }) {
            state.pageOffset = payload;
        }
    }
});

export const {
    changePageListAction,
    changeTotalCountAction,
    changePageSizeAction,
    changePageOffsetAction
} = systemSlice.actions;

export default systemSlice.reducer;
