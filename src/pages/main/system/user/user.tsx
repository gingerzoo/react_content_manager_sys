import React, { memo } from 'react';
import type { FC, ReactNode } from 'react';

interface Iprops {
    children?: ReactNode;
}

const User: FC<Iprops> = props => {
    return <div>User</div>;
};

export default memo(User);
