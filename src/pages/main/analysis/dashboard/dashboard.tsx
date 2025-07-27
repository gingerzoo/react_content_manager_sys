import React, { memo } from 'react';
import type { FC, ReactNode } from 'react';

interface Iprops {
    children?: ReactNode;
}

const Dashboard: FC<Iprops> = props => {
    return <div>DashBoard</div>;
};

export default memo(Dashboard);
