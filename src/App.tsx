import { memo } from 'react';
import type { FC, ReactNode } from 'react';
import { useActionState } from 'react';
import { useAppSelector, useAppDispatch } from './hooks/hook';
import { addCountAction } from './store/modules/main';
import { useRoutes } from 'react-router-dom';
import routes from './router/index';

interface Iprops {
  children?: ReactNode;
}

const App: FC<Iprops> = props => {
  const { count } = useAppSelector(state => ({
    count: state.main.count
  }));
  const dispatch = useAppDispatch();

  const handleBtnClick = () => {
    console.log('点我点我点我！！！！');
    dispatch(addCountAction(2));
  };

  const appRoutes = useRoutes(routes);

  return (
    <div>
      <div>App</div>
      <span>count: {count}</span>
      <button onClick={handleBtnClick}>点我加2</button>
      <div>{appRoutes}</div>
    </div>
  );
};

export default memo(App);
