import { memo, useRef, useState, useEffect } from 'react';
import type { FC, ReactNode } from 'react';
import LoginWrap from './style';
import { Tabs, Checkbox, Button, App as AntdApp } from 'antd';
import type { TabsProps, CheckboxProps } from 'antd';
import AccountLogin from './c-cpns/account-login';
import PhoneLogin from './c-cpns/phone-login';
import Register from './c-cpns/register';
import { UserOutlined, PhoneOutlined } from '@ant-design/icons';
import type { AccountLoginRef } from './c-cpns/account-login';
import { useAppDispatch } from '@/hooks/hook';
import { fetchLoginAction } from '@/store/modules/login';
import { useNavigate } from 'react-router-dom';
import { getRegistrationConfig } from '@/service/login/login';

interface Iprops {
    children?: ReactNode;
}

const Login: FC<Iprops> = () => {
    const accountLoginRef = useRef<AccountLoginRef>(null);
    // 登录按钮是否可点击
    const [isSubmitAbled, setIsSubmitAbled] = useState(false);
    const [rememberUsername, setRememberUsername] = useState(false);

    const [submitting, setSubmitting] = useState(false);
    // 注册弹窗独立管理，避免将注册表单状态混入登录表单。
    const [registerOpen, setRegisterOpen] = useState(false);
    const [registrationEnabled, setRegistrationEnabled] = useState(false);
    const [activeTab, setActiveTab] = useState('1');
    const { message } = AntdApp.useApp();

    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        // 清理旧版曾保存的明文密码，仅允许记住用户名。
        localStorage.removeItem('password');
        localStorage.removeItem('isPsdRemembered');
        const username = localStorage.getItem('username') ?? '';
        accountLoginRef.current?.setFormValues({ username });
        setRememberUsername(Boolean(username));

        const controller = new AbortController();
        void getRegistrationConfig(controller.signal).then(result => {
            if (!controller.signal.aborted) {
                setRegistrationEnabled(result.code === 200 && result.data?.registrationEnabled === true);
            }
        }).catch(() => {
            // 配置无法读取时，注册入口保持关闭。
        });
        return () => controller.abort();
    }, []);

    const onChange = (key: string) => {
        setActiveTab(key);
    };

    /**
     * 注册成功后回到账号登录，回填用户名并清空旧密码。
     * @param {string} username - 刚刚注册成功的用户名。
     * @returns {void} 无返回值；注册本身不会自动登录或保存密码。
     */
    const handleRegistered = (username: string) => {
        setRegisterOpen(false);
        setActiveTab('1');
        accountLoginRef.current?.setFormValues({ username, password: '' });
        setIsSubmitAbled(false);
    };

    // 每次子组件表单变化触发，判断是否禁用按钮
    const onFieldsChange = () => {
        if (!accountLoginRef.current) return;
        setIsSubmitAbled(!!accountLoginRef.current.isValid());
    };

    // 仅保存用户名，密码交给用户或浏览器的密码管理器。
    const onCheckBoxChange: CheckboxProps['onChange'] = e => {
        setRememberUsername(e.target.checked);
        if (!e.target.checked) localStorage.removeItem('username');
    };

    const handleSubmitBtnClick = async () => {
        if (submitting) return;
        setSubmitting(true);
        try {
            const values = await accountLoginRef.current?.validate();
            if (!values) return;


            await dispatch(fetchLoginAction(values)).unwrap();
            if (rememberUsername) localStorage.setItem('username', values.username);
            else localStorage.removeItem('username');
            navigate('/main');
        } catch (error: unknown) {
            // 表单校验失败时，Form.Item 已经显示具体提示。
            if (
                typeof error === 'object' &&
                error !== null &&
                'errorFields' in error
            ) {
                return;
        }

            message.error(
                typeof error === 'string'
                    ? error
                    : '登录失败，请稍后重试'
            );
        } finally {
            setSubmitting(false);
        }
    };

    const items: TabsProps['items'] = [
        {
            key: '1',
            forceRender: true,
            label: '帐号登录',
            children: <AccountLogin ref={accountLoginRef} onFieldsChange={onFieldsChange} />,
            icon: <UserOutlined />
        },
        {
            key: '2',
            label: '手机号登录',
            children: <PhoneLogin />,
            icon: <PhoneOutlined />
        }
    ];
    return (
        <LoginWrap>
            <h1>金基德</h1>
            <div className='content'>
                <Tabs activeKey={activeTab} items={items} type='card' onChange={onChange} />
            </div>
            <div className='bottom'>
                <div className='oper-box'>
                    <Checkbox checked={rememberUsername} onChange={onCheckBoxChange}>
                        记住账号
                    </Checkbox>
                    <Button type='link'>忘记密码</Button>
                </div>
                <Button
                    type='primary'
                    className='submit-btn'
                    disabled={!isSubmitAbled}
                    loading={submitting}
                    onClick={handleSubmitBtnClick}
                >
                    立即登录
                </Button>
                {registrationEnabled && <div className='register-entry'>
                    <span>还没有账号？</span>
                    <Button type='link' disabled={submitting} onClick={() => setRegisterOpen(true)}>
                        注册账号
                    </Button>
                </div>}
            </div>
            {registrationEnabled && <Register
                open={registerOpen}
                onClose={() => setRegisterOpen(false)}
                onSuccess={handleRegistered}
            />}
        </LoginWrap>
    );
};

export default memo(Login);
