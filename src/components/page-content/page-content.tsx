import React, { memo, useState, useEffect } from 'react';
import type { FC, ReactNode } from 'react';
import { Button, Table, Radio, Space, theme } from 'antd';
import PageContentWrap from './style';
import type { TableProps } from 'antd';
import { FormOutlined, DeleteOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '@/hooks/hook';
import { shallowEqual } from 'react-redux';
import {
    fetchPageListAction,
    deleteItemByIdAction,
    changePageSizeAction,
    changePaginationAction
} from '@/store/modules/main/system/system';
import type { IContentConfig } from '@/types/main';
// import contentConfig from '@/pages/main/system/user/config/content.config';

interface Iprops {
    children?: ReactNode;
    contentConfig: IContentConfig;
    handleModalOpen: () => void;
}

const PageContent: FC<Iprops> = props => {
    type DataIndexKeys = (typeof contentConfig.tableItems)[number]['dataIndex'];

    type IDataType = {
        [K in DataIndexKeys]: string;
    };

    type DataType = IDataType & {
        id: string;
    };

    // rowSelection object indicates the need for row selection
    type TableRowSelection<T extends object = object> = TableProps<T>['rowSelection'];
    const { contentConfig, handleModalOpen } = props;
    const { 
        pageList, 
        totalCount,
        pageSize,
        pageOffset,
        searchConditions

    } = useAppSelector(
        state => ({
            pageList: state.system.pageList,
            totalCount: state.system.totalCount,
            pageSize: state.system.pageSize,
            pageOffset: state.system.pageOffset,
            searchConditions: state.system.searchConditions
        }),
        shallowEqual
    );
    // const pageSize = 8;
    const pageName = contentConfig.pageName;
    console.log('page-content-------pageName----', pageName);

    const dispatch = useAppDispatch();

    // 选中某一行的处理
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);



    const {
        token: { colorBgContainer }
    } = theme.useToken();

    useEffect(() => {
        console.log('useEffect执行');
        dispatch(
            fetchPageListAction({
                pageName,
                queryInfo: { 
                    ...searchConditions,
                    offset: pageOffset,
                    size: pageSize
                 }
            })
        );

  
    }, [
        dispatch,
        pageName,
        searchConditions,
        pageOffset,
        pageSize
    ]);

    // 数组push方法返回的是新数组的长度啊
    const columns = contentConfig.tableItems.map(col => {
        if (col.dataIndex === 'enable') {
            return {
                ...col,
                render: (_, record) => (
                    <Button
                        color={record.enable === 1 ? 'primary' : 'danger'}
                        variant='outlined'
                        size='small'
                    >
                        {record.enable === 1 ? '启用' : '禁用'}
                    </Button>
                )
            };
        }
        return col;
    });

    columns.push({
        title: '操作',
        key: 'operation',
        align: 'center',
        render: (_, record) => (
            <Space size='middle'>
                <Button
                    type='text'
                    icon={<FormOutlined />}
                    onClick={() => handleEditBtnClick(record)}
                >
                    编辑
                </Button>
                <Button
                    type='text'
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteBtnClick(record)}
                >
                    删除
                </Button>
            </Space>
        )
    });

    const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
        console.log('selectedRowKeys changed: ', newSelectedRowKeys);
        setSelectedRowKeys(newSelectedRowKeys);
    };
    const rowSelection: TableRowSelection<DataType> = {
        selectedRowKeys,
        onChange: onSelectChange
    };

    const handlePageNumChange = (page: number, pageSize: number) => {
        dispatch(
            changePaginationAction({
                page,
                pageSize
            })
        );
    };

    const handleDeleteBtnClick = record => {
        console.log('record-----------删除', record);
        dispatch(
            deleteItemByIdAction({
                pageName,
                queryInfo: record.id
            })
        );
    };

    const handleEditBtnClick = record => {
        console.log('点击编辑按钮', record);
        // 把数据传给母组件
        props.handleModalOpen(true, record);
    };

    const handleCreateBtnClick = () => {
        props.handleModalOpen();
    };

    return (
        <PageContentWrap $contentBgColor={colorBgContainer}>
            <div className='content-header'>
                <h2>{contentConfig.header?.title}</h2>
                <Button size='large' type='primary' onClick={handleCreateBtnClick}>
                    {contentConfig.header?.btnTitle}
                </Button>
            </div>
            <Table<DataType>
                rowKey='id'
                columns={columns}
                dataSource={pageList}
                rowSelection={rowSelection}
                pagination={{
                    position: ['bottomCenter'],
                    total: totalCount,
                    current: Math.floor(pageOffset / pageSize) + 1,
                    pageSize,
                    showSizeChanger: true,
                    onChange: handlePageNumChange
                }}
            />
        </PageContentWrap>
    );
};

export default memo(PageContent);
