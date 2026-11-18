import { memo } from 'react';
import type { FC, ReactNode } from 'react';

interface Iprops {
    children?: ReactNode;
}

const Menu: FC<Iprops> = () => {
    return <div>Menu</div>;
};

export default memo(Menu);
