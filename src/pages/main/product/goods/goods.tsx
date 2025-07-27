import React, { memo } from 'react';
import type { FC, ReactNode } from 'react';

interface Iprops {
    children?: ReactNode;
}

const Goods: FC<Iprops> = props => {
    return <div>Goods</div>;
};

export default memo(Goods);
