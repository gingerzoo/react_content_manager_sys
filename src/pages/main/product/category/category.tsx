import { memo } from 'react';
import type { FC, ReactNode } from 'react';

interface Iprops {
    children?: ReactNode;
}

const Category: FC<Iprops> = () => {
    return <div>Category</div>;
};

export default memo(Category);
