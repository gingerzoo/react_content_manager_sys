import { memo } from 'react';
import type { FC, ReactNode } from 'react';
import MainWrapper from './style';

interface Iprops {
  children?: ReactNode;
}

const Main: FC<Iprops> = props => {
  // useAppSelector(state=>)
  return (
    <MainWrapper>
      <div>我是Main</div>
    </MainWrapper>
  );
};

export default memo(Main);
