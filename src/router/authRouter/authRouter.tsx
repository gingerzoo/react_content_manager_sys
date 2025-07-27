import { Navigate, useLocation } from 'react-router-dom';

interface IProps {
    children: JSX.Element;
}

const AuthRouter = ({ children }: IProps) => {
    const token = localStorage.getItem('token');
    //   const location = useLocation();

    if (!token) {
        // 未登录，重定向到 /login 并记录跳转前的路径
        return <Navigate to='/login' />;
    }

    // 已登录，放行
    return children;
};

export default AuthRouter;
