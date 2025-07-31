import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import store from './store/index';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import loadDataFromRefresh from '@/utils/loadDataFromRefresh';
import '@/assets/css/index.less';

// 刷新时获取存储在localStorage中的数据，不然一刷新就没了
loadDataFromRefresh();

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <Provider store={store}>
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </Provider>
    </StrictMode>
);
