import { configureStore } from '@reduxjs/toolkit';
import { useSelector, useDispatch } from 'react-redux';
import mainSlice from './modules/main';
import loginSlice from './modules/login';

const store = configureStore({
    reducer: {
        main: mainSlice,
        login: loginSlice
    }
});

// type TRootState = typeof(store.getState()) 这样写结果也是一样的
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
// export const useAppDispatch: () => AppDispatch = useDispatch;

// 官网最新写法
// export const useAppSelector = useSelector.withTypes<RootState>();
// export const useAppDispatch = useDispatch.withTypes<AppDispatch>();

export default store;
