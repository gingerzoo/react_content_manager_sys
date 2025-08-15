import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '@/store/index';
import { useState } from 'react';

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();

export function usePageModal<T = any>() {
    // 控制Modal的开关
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    // 编辑数据
    const [editData, setEditData] = useState(null);
    // 是否是编辑状态
    const [isEditState, setIsEditState] = useState(false);

    const handleModalOpen = (isEdit = false, record?: any) => {
        setEditData(record || null);
        setIsModalOpen(true);
        setIsEditState(isEdit);
    };
    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditData(null);
    };

    return {
        isModalOpen,
        editData,
        isEditState,
        handleModalOpen,
        handleModalClose
    };
}
