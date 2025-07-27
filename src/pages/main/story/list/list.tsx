import React, { memo } from 'react';
import type { FC, ReactNode } from 'react';

interface Iprops {
    children?: ReactNode;
}

const List: FC<Iprops> = props => {
    return <div>List</div>;
};

export default memo(List);
