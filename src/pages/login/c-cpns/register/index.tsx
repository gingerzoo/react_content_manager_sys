import { useRef, useState } from 'react';
import axios from 'axios';
import { Alert, App, Button, Form, Input, Modal } from 'antd';
import { registerAccount } from '@/service/login/login';
import { getPasswordError } from '@/utils/password';
import RegisterWrap from './style';

interface RegisterValues {
    username: string;
    password: string;
    confirmPassword: string;
}

interface RegisterProps {
    open: boolean;
    onClose: () => void;
    onSuccess: (username: string) => void;
}

/**
 * 展示注册弹窗，校验表单并提交普通账号注册请求。
 * @param {RegisterProps} props - 开关、关闭回调和注册成功后回填用户名的回调。
 * @returns {import('react').ReactElement} 注册弹窗。
 */
export default function Register({ open, onClose, onSuccess }: RegisterProps) {
    const [form] = Form.useForm<RegisterValues>();
    // state 驱动按钮样式；ref 在首次 await 之前同步阻止重复提交。
    const [submitting, setSubmitting] = useState(false);
    const submittingRef = useRef(false);
    const { message } = App.useApp();

    /**
     * 关闭弹窗并清空敏感表单；请求进行期间禁止关闭。
     * @returns {void} 无返回值。
     */
    const handleClose = () => {
        if (submittingRef.current) return;
        form.resetFields();
        onClose();
    };

    /**
     * 完成表单校验与注册，成功后将用户名交给登录页。
     * @returns {Promise<void>} 完成提交及错误提示，不向事件系统抛出错误。
     */
    const handleSubmit = async () => {
        if (submittingRef.current) return;
        submittingRef.current = true;
        setSubmitting(true);
        try {
            const values = await form.validateFields();
            const result = await registerAccount({
                username: values.username,
                password: values.password
            });
            if (result.code !== 200) {
                message.error(result.message || '注册失败');
                return;
            }
            form.resetFields();
            message.success('注册成功，请使用新账号登录');
            onSuccess(values.username);
        } catch (error: unknown) {
            // 表单错误由 Form.Item 就地展示，无需再弹出通用失败提示。
            if (typeof error === 'object' && error !== null && 'errorFields' in error) return;
            if (axios.isAxiosError(error)) {
                const serverMessage = error.response?.data?.message;
                message.error(
                    typeof serverMessage === 'string'
                        ? serverMessage
                        : error.response
                          ? '注册失败，请稍后重试'
                          : '网络连接失败，请检查网络或后端服务'
                );
            } else {
                message.error('注册失败，请稍后重试');
            }
        } finally {
            submittingRef.current = false;
            setSubmitting(false);
        }
    };

    return (
        <Modal
            title='注册账号'
            open={open}
            onCancel={handleClose}
            closable={!submitting}
            maskClosable={!submitting}
            keyboard={!submitting}
            footer={null}
        >
            <RegisterWrap>
                <Alert type='info' showIcon message='新账号默认可使用内容助手，并只读查看、筛选部门和角色。' />
                <Form
                    form={form}
                    layout='vertical'
                    onFinish={() => void handleSubmit()}
                    disabled={submitting}
                    className='register-form'
                >
                    <Form.Item
                        name='username'
                        label='用户名'
                        rules={[
                            { required: true, message: '请输入用户名' },
                            {
                                pattern: /^[A-Za-z0-9][A-Za-z0-9_-]{2,49}$/,
                                message:
                                    '需为 3–50 位，以字母或数字开头，仅支持字母、数字、下划线和短横线'
                            }
                        ]}
                    >
                        <Input autoComplete='username' maxLength={50} placeholder='请输入用户名' />
                    </Form.Item>
                    <Form.Item
                        name='password'
                        label='密码'
                        rules={[
                            { required: true, message: '请输入密码' },
                            {
                                validator: (_, value: unknown) => {
                                    const error = getPasswordError(value);
                                    return error
                                        ? Promise.reject(new Error(error))
                                        : Promise.resolve();
                                }
                            }
                        ]}
                    >
                        <Input.Password
                            autoComplete='new-password'
                            maxLength={128}
                            placeholder='6–128 位，字母、数字、特殊符号至少两种'
                        />
                    </Form.Item>
                    <Form.Item
                        name='confirmPassword'
                        label='确认密码'
                        dependencies={['password']}
                        rules={[
                            { required: true, message: '请再次输入密码' },
                            ({ getFieldValue }) => ({
                                validator: (_, value: string) =>
                                    !value || getFieldValue('password') === value
                                        ? Promise.resolve()
                                        : Promise.reject(new Error('两次输入的密码不一致'))
                            })
                        ]}
                    >
                        <Input.Password
                            autoComplete='new-password'
                            maxLength={128}
                            placeholder='请再次输入密码'
                        />
                    </Form.Item>
                    <Button type='primary' htmlType='submit' block loading={submitting}>
                        立即注册
                    </Button>
                </Form>
            </RegisterWrap>
        </Modal>
    );
}
