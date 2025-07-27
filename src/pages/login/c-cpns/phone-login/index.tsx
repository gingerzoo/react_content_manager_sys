import React, { memo } from 'react';
import type { FC, ReactNode } from 'react';
import type { FormProps } from 'antd';
import { Form, Input, Button } from 'antd';

interface Iprops {
    children?: ReactNode;
}

type FieldType = {
    phonenumber?: string;
    verification?: number;
};

const onFinish: FormProps<FieldType>['onFinish'] = values => {
    console.log('Success:', values);
};

const onFinishFailed: FormProps<FieldType>['onFinishFailed'] = errorInfo => {
    console.log('Failed:', errorInfo);
};

const PhoneLogin: FC<Iprops> = props => {
    return (
        <div>
            <Form
                name='basic'
                labelCol={{ span: 5 }}
                wrapperCol={{ span: 18 }}
                style={{ maxWidth: 380 }}
                initialValues={{ remember: true }}
                onFinish={onFinish}
                onFinishFailed={onFinishFailed}
                autoComplete='off'
            >
                <Form.Item<FieldType>
                    label='手机号'
                    name='phonenumber'
                    rules={[
                        {
                            required: true,
                            message: 'Please input your phone number!'
                        }
                    ]}
                >
                    <Input placeholder='请输入手机号' />
                </Form.Item>

                <Form.Item<FieldType>
                    label='验证码'
                    name='verification'
                    rules={[
                        {
                            required: true,
                            message: 'Please input your verification!'
                        }
                    ]}
                >
                    <div className='get-number-box'>
                        <Input placeholder='请输入验证码' />
                        <Button type='primary' className='get-number-btn'>
                            获取验证码
                        </Button>
                    </div>
                </Form.Item>
            </Form>
        </div>
    );
};

export default memo(PhoneLogin);
