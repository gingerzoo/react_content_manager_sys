import React, { Children, memo } from 'react';
import type { FC, ReactNode } from 'react';
import type { ISearchConfig } from '@/types/index';
import { Button, Form, Input, Select, DatePicker, theme } from 'antd';
import PageSearchWrap from './style';
import { changeSearchConditionsAction } from '@/store/modules/main/system/system';
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
            return <RangePicker style={{ width: '100%' }}/>;
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
        const values = form.getFieldsValue();

        const normalizeText = (value: unknown) =>
        typeof value === 'string' ? value.trim() : '';
       
        let enable: 0 | 1 | null = null;

        if (values.enable === '1' || values.enable === 1) {
            enable = 1;
        } else if (values.enable === '0' || values.enable === 0) {
            enable = 0;
        }

        const range = values.createdRange;
        dispatch(
            changeSearchConditionsAction({
                username: normalizeText(values.username),
                realname: normalizeText(values.realname),
                cellphone: normalizeText(values.cellphone),
                enable,
                createdFrom: range?.[0]?.format('YYYY-MM-DD') ?? null,
                createdTo: range?.[1]?.format('YYYY-MM-DD') ?? null
            })
        );
    };

    const handleResetBtnClick = () => {
        form.resetFields();
        dispatch(
            changeSearchConditionsAction({
                username: '',
                realname: '',
                cellphone: '',
                enable: null,
                createdFrom: null,
                createdTo: null
            })
        );
    };

    const {
        token: { colorBgContainer }
    } = theme.useToken();
    return (
        <PageSearchWrap $searchBgColor={colorBgContainer}>
            <Form 
                form={form} 
                layout='horizontal'
                labelCol={{ flex: '84px' }}
                wrapperCol={{ flex: 1 }}
                labelWrap
            >
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
