import React, { memo } from 'react';
import type { FC, ReactNode } from 'react';
import PageSearch from '@/components/page-search/page-search';
import PageContent from '@/components/page-content/page-content';
import PageModal from '@/components/page-modal/page-modal';
import searchConfig from './config/search.config';
import contentConfig from './config/content.config';
import modalConfig from './config/modal.config';
import { usePageModal } from '@/hooks/hook';

interface Iprops {
    children?: ReactNode;
}

const Department: FC<Iprops> = props => {
    const { isModalOpen, editData, isEditState, handleModalOpen, handleModalClose } =
        usePageModal();
    return (
        <div>
            <PageSearch searchConfig={searchConfig} />
            <PageContent contentConfig={contentConfig} handleModalOpen={handleModalOpen} />
            <PageModal
                modalConfig={modalConfig}
                isModalOpen={isModalOpen}
                editData={editData}
                isEditState={isEditState}
                handleModalClose={handleModalClose}
            />
        </div>
    );
};

export default memo(Department);
