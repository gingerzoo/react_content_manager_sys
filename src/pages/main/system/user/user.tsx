import React, { memo, useState } from 'react';
import type { FC, ReactNode } from 'react';
import PageSearch from '@/components/page-search/page-search';
import PageContent from '@/components/page-content/page-content';
import PageModal from '@/components/page-modal/page-modal';
import searchConfig from './config/search.config';
import contentConfig from './config/content.config';
import modalConfig from './config/modal.config';

interface Iprops {
    children?: ReactNode;
}

const User: FC<Iprops> = props => {
    // 控制Modal的开关
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const handleModalOpen = (record?: any) => {
        setEditData(record || null);
        setIsModalOpen(true);
    };
    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditData(null);
    };

    // 编辑数据
    const [editData, setEditData] = useState(null);

    return (
        <div>
            <PageSearch searchConfig={searchConfig} />
            <PageContent contentConfig={contentConfig} handleModalOpen={handleModalOpen} />
            <PageModal
                modalConfig={modalConfig}
                isModalOpen={isModalOpen}
                editData={editData}
                handleModalClose={handleModalClose}
            />
        </div>
    );
};

export default memo(User);
