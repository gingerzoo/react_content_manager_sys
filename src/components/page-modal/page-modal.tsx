import React, { memo, useState, useEffect } from 'react';
import type { FC, ReactNode } from 'react';
import { Button, Modal, Form, Input, Select } from 'antd';
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
        try {
            const values = await form.validateFields();

            // const values = await form.getFieldsValue();
            if (!isEditState) {
                dispatch(
                    createNewItemAction({
                        pageName,
                        queryInfo: {
                            ...values
                        }
                    })
                );
            } else {
                dispatch(
                    editPageItemInfoAction({
                        pageName,
                        userId: editData.id,
                        queryInfo: {
                            ...values
                        }
                    })
                );
            }

            // console.log('表单校验数据---------', values);
            handleModalClose();
        } catch (err) {
            // console.log('表达校验未通过', err);
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
                closable={{ 'aria-label': 'Custom Close Button' }}
                open={isModalOpen}
                onOk={handleOk}
                centered
                onCancel={handleCancel}
                okText='确认'
                cancelText='取消'
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
