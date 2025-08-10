import React, { Children, memo } from 'react';
import type { FC, ReactNode } from 'react';
import type { ISearchConfig } from '@/types/index';
import { Button, Form, Input, Select, DatePicker, theme } from 'antd';
import searchConfig from '@/pages/main/system/user/config/search.config';
import PageSearchWrap from './style';

interface Iprops {
    children?: ReactNode;
    searchConfig: ISearchConfig;
}

const { RangePicker } = DatePicker;

const PageSearch: FC<Iprops> = props => {
    const [form] = Form.useForm();

    const renderFormItem = (item: ISearchConfig['formItems'][number]) => {
        if (item.type === 'input') {
            return <Input placeholder={item.placeholder} />;
        } else if (item.type === 'createAt') {
            return <RangePicker />;
        } else if (item.type === 'select') {
            return (
                <Select>
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

    const {
        token: { colorBgContainer, borderRadiusLG }
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
                <Button>重置</Button>
                <Button type='primary' className='ensure-btn' autoInsertSpace={false}>
                    确定
                </Button>
            </div>
        </PageSearchWrap>
    );
};

export default memo(PageSearch);
