import React, { forwardRef, memo, useImperativeHandle } from 'react';
import type { FC, ReactNode } from 'react';
import { Form, Input } from 'antd';

interface Iprops {
    children?: ReactNode;
    onFieldsChange: () => void;
}

type FieldType = {
    name?: string;
    password?: string;
};

// 定义给父组件用的ref类型接口
export interface AccountLoginRef {
    getFormValues: () => FieldType;
    validate: () => Promise<FieldType>;
    setFormValues: (data: FieldType) => void;
    isValid: () => Boolean;
}

const AccountLogin = forwardRef<AccountLoginRef, Iprops>((props, ref) => {
    const { onFieldsChange } = props;
    const [form] = Form.useForm();

    // 用于判断账号密码是否都非空
    const isValid = () => {
        const values = form.getFieldsValue();
        return !!values.name && !!values.password;
    };

    useImperativeHandle(ref, () => ({
        getFormValues: () => form.getFieldsValue(),
        validate: () => form.validateFields(),
        setFormValues: (data: FieldType) => form.setFieldsValue(data),
        isValid
    }));

    // 监听表单字段变化
    const handleValuesChange = () => {
        if (onFieldsChange) onFieldsChange();
    };

    return (
        // form要绑定给表单！！！
        <div>
            <Form
                form={form}
                name='basic'
                labelCol={{ span: 5 }}
                wrapperCol={{ span: 18 }}
                style={{ maxWidth: 380 }}
                initialValues={{ remember: true }}
                autoComplete='off'
                onValuesChange={handleValuesChange}
            >
                <Form.Item<FieldType>
                    label='帐号'
                    name='name'
                    rules={[
                        {
                            required: true,
                            message: 'Please input your username!'
                        },
                        {
                            pattern: /^[a-zA-Z0-9].{2,}$/,
                            message: '账号至少3位，且以字母或数字开头'
                        }
                    ]}
                >
                    <Input placeholder='请输入帐号' />
                </Form.Item>
                <Form.Item<FieldType>
                    label='密码'
                    name='password'
                    rules={[
                        {
                            required: true,
                            message: 'Please input your password!'
                        },
                        {
                            min: 6,
                            message: '密码至少六位'
                        }
                    ]}
                >
                    <Input.Password placeholder='请输入帐号密码' />
                </Form.Item>
            </Form>
        </div>
    );
});

export default memo(AccountLogin);
