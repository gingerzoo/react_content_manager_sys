import { memo } from 'react';
import type { FC, ReactNode } from 'react';

interface Iprops {
    children?: ReactNode;
}

const Overview: FC<Iprops> = () => {
    return <div>Overview</div>;
};

export default memo(Overview);
