import React, { memo } from 'react';
import type { FC, ReactNode } from 'react';

interface Iprops {
    children?: ReactNode;
}

const Category: FC<Iprops> = props => {
    return <div>Category</div>;
};

export default memo(Category);
