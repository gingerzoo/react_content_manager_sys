import React, { memo } from 'react';
import type { FC, ReactNode } from 'react';

interface Iprops {
    children?: ReactNode;
}

const Department: FC<Iprops> = props => {
    return <div>Department</div>;
};

export default memo(Department);
