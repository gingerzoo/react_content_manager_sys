import React, { memo, useState, useEffect, useRef } from 'react';
import type { FC, ReactNode } from 'react';
import { Button, Modal, Form, Input, Select, App as AntdApp } from 'antd';
import PageModalWrap from './style';
import type { IModalConfig } from '@/types/index';
import { useAppDispatch, useAppSelector } from '@/hooks/hook';
import { shallowEqual } from 'react-redux';
import { createNewItemAction, editPageItemInfoAction } from '@/store/modules/main/system/system';
// import { createStyles } from 'antd-style';

interface Iprops {
    children?: ReactNode;
    isModalOpen: boolean;
    modalConfig: IModalConfig;
    editData: any;
    isEditState: boolean;
    handleModalClose: () => void;
}

const PageModal: FC<Iprops> = props => {
    const { isModalOpen, modalConfig, editData, isEditState, handleModalClose } = props;
    const pageName = modalConfig.pageName;
    const modalTitle = (isEditState ? '编辑' : '新建') + modalConfig.headerName;
    const submittingRef = useRef(false);
    const [submitting, setSubmitting] = useState(false);
    const { message } = AntdApp.useApp();

    const { rolesList, menusList, departmentList } = useAppSelector(
        state => ({
            rolesList: state.main.pageRoles,
            menusList: state.main.pageMenus,
            departmentList: state.main.pageDepartments
        }),
        shallowEqual
    );

    const dispatch = useAppDispatch();
    const [form] = Form.useForm();

    useEffect(() => {
        if (editData) {
            form.setFieldsValue(editData);
        } else {
            form.resetFields();
        }
    }, [form, editData]);

    const handleOk = async () => {
        if (submittingRef.current) return;

        // 同步上锁，必须放在第一次 await 之前。
        submittingRef.current = true;
        setSubmitting(true);
        try {
            const values = await form.validateFields();

            // const values = await form.getFieldsValue();
            if (!isEditState) {
                await dispatch(
                    createNewItemAction({
                        pageName,
                        queryInfo: {
                            ...values
                        }
                    })
                ).unwrap();
            } else {
                await dispatch(
                    editPageItemInfoAction({
                        pageName,
                        userId: editData.id,
                        queryInfo: {
                            ...values
                        }
                    })
                ).unwrap();
            }

            // console.log('表单校验数据---------', values);
            handleModalClose();
        } catch (error: unknown) {
            if (
                typeof error === 'object' &&
                error !== null &&
                'errorFields' in error
            ) {
                return;
            }

            // 编辑失败提示暂时沿用现有 thunk 的处理。
            if (!isEditState) {
                message.error(
                    typeof error === 'string'
                        ? error
                        : '创建失败，请稍后重试'
                );
            }
        }  finally {
            submittingRef.current = false;
            setSubmitting(false);
        }
    };

    const handleCancel = () => {
        handleModalClose();
    };

    const renderModalItem = item => {
        if (item.type === 'input') {
            return item.name === 'password' ? (
                <Input.Password placeholder={item.placeholder} />
            ) : (
                <Input placeholder={item.placeholder} />
            );
        } else if (item.type === 'select') {
            let options: any[] = [];
            switch (item.name) {
                case 'roleId':
                    options = rolesList;
                    break;
                case 'parentId':
                case 'departmentId':
                    options = departmentList;
                    break;
                default:
                    break;
            }
            return (
                <Select placeholder={item.placeholder}>
                    {options.length &&
                        options.map(option => {
                            return (
                                <Select.Option value={option.id} key={option.id}>
                                    {option.name}
                                </Select.Option>
                            );
                        })}
                </Select>
            );
        } else if (item.type === 'custom') {
            return props.children;
        }
    };
    return (
        <PageModalWrap>
            <Modal
                title={modalTitle}
                open={isModalOpen}
                onOk={handleOk}
                centered
                onCancel={handleCancel}
                okText='确认'
                cancelText='取消'
                confirmLoading={submitting}
                cancelButtonProps={{ disabled: submitting }}
                closable={!submitting}
                maskClosable={!submitting}
                keyboard={!submitting}
                classNames={{
                    header: 'my-modal-header'
                }}
            >
                <Form
                    form={form}
                    labelCol={{ span: 5 }}
                    wrapperCol={{ span: 15 }}
                    layout='horizontal'
                    style={{ maxWidth: 500 }}
                >
                    {modalConfig.modalItems.map((item, idx) => {
                        return isEditState && item.name === 'password' ? (
                            ''
                        ) : (
                            <Form.Item
                                key={item.name}
                                label={item.label}
                                name={item.name}
                                rules={[
                                    {
                                        required: true,
                                        message: `请输入${item.label}`
                                    }
                                ]}
                            >
                                {renderModalItem(item)}
                            </Form.Item>
                        );
                    })}
                </Form>
            </Modal>
        </PageModalWrap>
    );
};

export default memo(PageModal);
