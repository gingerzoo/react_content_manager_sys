import React, { memo, useRef, useState, useEffect } from 'react';
import type { FC, ReactNode } from 'react';
import LoginWrap from './style';
import { Tabs, Checkbox, Button } from 'antd';
import type { TabsProps, CheckboxProps } from 'antd';
import AccountLogin from './c-cpns/account-login';
import PhoneLogin from './c-cpns/phone-login';
import { UserOutlined, PhoneOutlined } from '@ant-design/icons';
import type { AccountLoginRef } from './c-cpns/account-login';
import { useAppDispatch } from '@/hooks/hook';
import { fetchLoginAction } from '@/store/modules/login';
import { useNavigate } from 'react-router-dom';

interface Iprops {
    children?: ReactNode;
}

const Login: FC<Iprops> = props => {
    const accountLoginRef = useRef<AccountLoginRef>(null);
    // 登录按钮是否可点击
    const [isSubmitAbled, setIsSubmitAbled] = useState(false);
    // 是否记住密码
    const [isPsdRemembered, setIsPswRemember] = useState(true);

    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        const rememberedUsername = localStorage.getItem('username');
        const rememberedPassword = localStorage.getItem('password');
        const isPsdRememberedStr = localStorage.getItem('isPsdRemembered');

        let isPsdRemembered = true; // 设定默认值为 true
        if (isPsdRememberedStr !== null) {
            isPsdRemembered = isPsdRememberedStr === 'true';
        }

        const defaultValues = {
            name: rememberedUsername || ''
        };

        if (accountLoginRef.current && isPsdRemembered) {
            defaultValues['password'] = rememberedPassword || '';
            setIsSubmitAbled(true);
        }

        // 填充表单
        accountLoginRef.current?.setFormValues(defaultValues);
        console.log('useEffext里的isPsdRemembered-------', isPsdRemembered);

        setIsPswRemember(isPsdRemembered);
    }, []);

    const onChange = (key: string) => {
        console.log(key);
    };

    // 每次子组件表单变化触发，判断是否禁用按钮
    const onFieldsChange = () => {
        if (!accountLoginRef.current) return;
        setIsSubmitAbled(!!accountLoginRef.current.isValid());
    };

    // 记住密码状态更改
    const onCheckBoxChange: CheckboxProps['onChange'] = e => {
        console.log(`checked = ${e.target.checked}`);
        console.log('记住密码状态更改---------', e.target.checked);
        setIsPswRemember(e.target.checked);
    };

    const handleSubmitBtnClick = async () => {
        try {
            const values = await accountLoginRef.current?.validate();
            console.log('表单数据:', values);

            localStorage.setItem('username', values?.name || '');
            console.log('点击登录时是否记住密码-------', isPsdRemembered);
            dispatch(fetchLoginAction(values)).then(() => {
                navigate('/main');
            });

            if (isPsdRemembered) {
                localStorage.setItem('password', values?.password || '');
                localStorage.setItem('isPsdRemembered', 'true');
            } else {
                // localStorage.removeItem('username');
                localStorage.removeItem('password');
                localStorage.setItem('isPsdRemembered', 'false');
            }

            // TODO: 调用接口登录
        } catch (err) {
            console.log('表单校验失败:', err);
        }
    };

    const items: TabsProps['items'] = [
        {
            key: '1',
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
            <h1>react后台管理系统</h1>
            <div className='content'>
                <Tabs defaultActiveKey='1' items={items} type='card' onChange={onChange} />
            </div>
            <div className='bottom'>
                <div className='oper-box'>
                    <Checkbox checked={isPsdRemembered} onChange={onCheckBoxChange}>
                        记住密码
                    </Checkbox>
                    <Button type='link'>忘记密码</Button>
                </div>
                <Button
                    type='primary'
                    className='submit-btn'
                    disabled={!isSubmitAbled}
                    onClick={handleSubmitBtnClick}
                >
                    立即登录
                </Button>
            </div>
        </LoginWrap>
    );
};

export default memo(Login);
