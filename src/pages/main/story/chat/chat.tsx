import React, { memo } from 'react';
import type { FC, ReactNode } from 'react';

interface Iprops {
    children?: ReactNode;
}

const Chat: FC<Iprops> = props => {
    return <div>Chat</div>;
};

export default memo(Chat);
