import { memo } from 'react';
import type { FC, ReactNode } from 'react';

interface Iprops {
    children?: ReactNode;
}

const Dashboard: FC<Iprops> = () => {
    return <div>DashBoard</div>;
};

export default memo(Dashboard);
