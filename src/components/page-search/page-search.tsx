import React, { Children, memo } from 'react';
import type { FC, ReactNode } from 'react';
import type { ISearchConfig } from '@/types/index';
import { Button, Form, Input, Select, DatePicker, theme } from 'antd';
import PageSearchWrap from './style';
import { fetchPageListAction } from '@/store/modules/main/system/system';
import { useAppDispatch } from '@/hooks/hook';

interface Iprops {
    children?: ReactNode;
    searchConfig: ISearchConfig;
}

const { RangePicker } = DatePicker;

const PageSearch: FC<Iprops> = props => {
    const { searchConfig } = props;
    const [form] = Form.useForm();

    const renderFormItem = (item: ISearchConfig['formItems'][number]) => {
        if (item.type === 'input') {
            return <Input placeholder={item.placeholder} />;
        } else if (item.type === 'createAt') {
            return <RangePicker />;
        } else if (item.type === 'select') {
            return (
                <Select placeholder={item.placeholder}>
                    {item.options &&
                        item.options.map(option => {
                            return (
                                <Select.Option value={option.value} key={option.value}>
                                    {option.label}
                                </Select.Option>
                            );
                        })}
                </Select>
            );
        } else if (item.type === 'custom') {
            return props.children;
        }
    };

    const dispatch = useAppDispatch();

    const handleEnsureBtnClick = () => {
        const formValues = form.getFieldsValue();
        dispatch(
            fetchPageListAction({
                pageName: searchConfig.pageName,
                queryInfo: formValues
            })
        );
    };

    const handleResetBtnClick = () => {
        form.resetFields();
    };

    const {
        token: { colorBgContainer }
    } = theme.useToken();
    return (
        <PageSearchWrap $searchBgColor={colorBgContainer}>
            <Form form={form} labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
                {props.searchConfig.formItems &&
                    searchConfig.formItems.map(item => {
                        return (
                            <Form.Item label={item.label} name={item.name} key={item.label}>
                                {renderFormItem(item)}
                            </Form.Item>
                        );
                    })}
            </Form>
            <div className='btns'>
                <Button onClick={handleResetBtnClick}>重置</Button>
                <Button
                    type='primary'
                    className='ensure-btn'
                    autoInsertSpace={false}
                    onClick={handleEnsureBtnClick}
                >
                    确定
                </Button>
            </div>
        </PageSearchWrap>
    );
};

export default memo(PageSearch);
