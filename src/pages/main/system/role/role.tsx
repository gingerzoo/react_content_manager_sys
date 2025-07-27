import React, { memo } from 'react';
import type { FC, ReactNode } from 'react';

interface Iprops {
    children?: ReactNode;
}

const Role: FC<Iprops> = props => {
    return <div>Role</div>;
};

export default memo(Role);
