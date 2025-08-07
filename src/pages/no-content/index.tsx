import React, { memo, useCallback, useState } from 'react';
import type { FC, ReactNode } from 'react';
import NoContentWrap from './style';

interface Iprops {
    children?: ReactNode;
}

const NoContent: FC<Iprops> = props => {

    return (
        <NoContentWrap>
            <h2>当前页面无内容，请联系管理员～～～</h2>
        </NoContentWrap>
    );
};

export default memo(NoContent);
