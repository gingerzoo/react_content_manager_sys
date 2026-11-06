import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import {
    getPageListData,
    deletePageItemById,
    createNewPageItem,
    editPageItemInfo
} from '@/service/main/stystem/system';
import { showMessage } from '@/utils/message';
import type { RootState } from '@/store';
import axios from 'axios';

interface Iquery {
    pageName: string;
    queryInfo: any;
    userId?: number;
}

interface UserSearchConditions {
    username: string;
    realname: string;
    cellphone: string;
    enable: 0 | 1 | null;
    createdFrom: string | null;
    createdTo: string | null;
}

const initialSearchConditions: UserSearchConditions = {
    username: '',
    realname: '',
    cellphone: '',
    enable: null,
    createdFrom: null,
    createdTo: null
};
const initialState = {
    pageList: [],
    totalCount: 0,
    pageSize: 4,
    pageOffset: 0,
    searchConditions: initialSearchConditions
};

// 异步action也要导出啊！！！！
// 获取pagelist的异步action
export const fetchPageListAction = createAsyncThunk<
    void,
    Iquery,
    {
        state: RootState;
        rejectValue: string;
    }
>(
    'system/fetchList',
    async (data: Iquery, { dispatch, getState, rejectWithValue }) => {
        try {
            console.log('fetchPageListAction---------------data.pageName', data.pageName,data.queryInfo);
            const result = await getPageListData(data.pageName, data.queryInfo);
            console.log("result------------",result)
            if (result.code !== 200) {
                return rejectWithValue(result.message || '获取列表失败');
            }

            if (
                !result.data ||
                !Array.isArray(result.data.list) ||
                typeof result.data.totalCount !== 'number'
            ) {
                return rejectWithValue('列表接口返回的数据格式不正确');
            }
            const { list, totalCount } = result.data;
        
            const { offset, size } = data.queryInfo;
            const currentState = getState().system;

            // 请求期间用户可能已经切换页码。
            // 不让旧页码的响应修改当前分页。
            if (
                offset !== currentState.pageOffset ||
                size !== currentState.pageSize
            ) {
                return;
            }

            // 总数为 0 时，仍停留在第一页，offset 为 0。
            const lastPageOffset =
                totalCount === 0
                    ? 0
                    : Math.floor((totalCount - 1) / size) * size;

            dispatch(changeTotalCountAction(totalCount));

            if (offset > lastPageOffset) {
                // 清除旧页数据，再修正分页状态。
                dispatch(changePageListAction([]));
                dispatch(changePageOffsetAction(lastPageOffset));

                // pageOffset 变化后，组件的 useEffect 会重新请求。
                return;
            }

            dispatch(changePageListAction(list));
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                const serverMessage = error.response?.data?.message;

                return rejectWithValue(
                    typeof serverMessage === 'string'
                        ? serverMessage
                        : '获取列表失败，请检查网络或后端服务'
                );
            }

            return rejectWithValue(
                error instanceof Error
                    ? error.message
                    : '获取列表失败'
            );
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
        const result = await editPageItemInfo(data.pageName, data.userId!, data.queryInfo);
        if (result.code !== 200) {
            const errorMessage = result.message || '编辑失败';
            showMessage('error', errorMessage);
            return rejectWithValue(errorMessage);
        }
        showMessage('success', '编辑成功');

        dispatch(
            fetchPageListAction({
                pageName: data.pageName,
                queryInfo: {
                    ...getState().system.searchConditions,
                    offset: getState().system.pageOffset,
                    size: getState().system.pageSize
                }
            })
        );
    } catch (error: unknown) {
    let errorMessage = '编辑失败，请稍后重试';

        if (axios.isAxiosError(error)) {
            const serverMessage = error.response?.data?.message;

            if (
                typeof serverMessage === 'string' &&
                serverMessage.trim()
            ) {
                errorMessage = serverMessage;
            } else if (!error.response) {
                errorMessage = '请求失败，请检查网络或后端服务';
            }
        }

        showMessage('error', errorMessage);
        return rejectWithValue(errorMessage);
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
        const result = await deletePageItemById(data.pageName, data.queryInfo);
        if (result.code !== 200) {
           if (result.code !== 200) {
            const errorMessage = result.message || '删除失败';

            showMessage('error', errorMessage);
            return rejectWithValue(errorMessage);
        }
                }
        showMessage('success', '删除成功');
        dispatch(
            fetchPageListAction({
                pageName: data.pageName,
                queryInfo: {
                    ...getState().system.searchConditions,
                    offset: getState().system.pageOffset,
                    size: getState().system.pageSize
                }
            })
        );
    } catch (error: unknown) {
        let errorMessage = '删除失败，请稍后重试';

        if (axios.isAxiosError(error)) {
            const serverMessage = error.response?.data?.message;

            if (
                typeof serverMessage === 'string' &&
                serverMessage.trim()
            ) {
                errorMessage = serverMessage;
            } else if (!error.response) {
                errorMessage = '请求失败，请检查网络或后端服务';
            }
        }

        showMessage('error', errorMessage);
        return rejectWithValue(errorMessage);
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
        // showMessage('success', '创建成功');

        if (result.code !== 200) {
            return rejectWithValue(result.message || '创建失败');
        }

        dispatch(
            fetchPageListAction({
                pageName: data.pageName,
                queryInfo: {
                    ...getState().system.searchConditions,
                    offset: getState().system.pageOffset,
                    size: getState().system.pageSize
                }
            })
        );

        console.log('获得列表数据-------', result.data);
    } catch (error: unknown) {
        // showMessage('error', '创建失败');
          if (axios.isAxiosError(error)) {
            const serverMessage = error.response?.data?.message;

            return rejectWithValue(
                typeof serverMessage === 'string'
                    ? serverMessage
                    : '请求失败，请检查网络或后端服务'
            );
        }

        return rejectWithValue('创建失败，请稍后重试');
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
        },
        changeSearchConditionsAction(
            state,
            action: PayloadAction<UserSearchConditions>
        ) {
            state.searchConditions = action.payload;
            state.pageOffset = 0;
        },
        changePaginationAction(
            state,
            action: PayloadAction<{
                page: number;
                pageSize: number;
            }>
        ) {
            const { page, pageSize } = action.payload;

            // 每页条数变化时，回到第一页。
            const nextPage = pageSize === state.pageSize ? page : 1;

            state.pageSize = pageSize;
            state.pageOffset = (nextPage - 1) * pageSize;
        },
    }
});

export const {
    changePageListAction,
    changeTotalCountAction,
    changePageSizeAction,
    changePageOffsetAction,
    changePaginationAction,
    changeSearchConditionsAction
} = systemSlice.actions;

export default systemSlice.reducer;
