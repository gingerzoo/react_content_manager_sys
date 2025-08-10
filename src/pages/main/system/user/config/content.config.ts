import type { IContentonfig } from '@/types/main';

const contentConfig: IContentonfig = {
    pageName: 'users',
    header: {
        title: '用户列表',
        btnTitle: '新建用户'
    },
    tableItems: [
        {
            dataIndex: 'name',
            title: '用户名',
            width: '150px',
            align: 'center'
        },
        {
            dataIndex: 'realname',
            title: '真实姓名',
            width: '180px',
            align: 'center'
        },
        {
            dataIndex: 'cellphone',
            title: '手机号码',
            width: '180px',
            align: 'center'
        },
        {
            dataIndex: 'enable',
            title: '状态',
            width: '100px',
            align: 'center'
        },
        {
            dataIndex: 'createAt',
            title: '创建时间',
            align: 'center'
        },
        {
            dataIndex: 'updateAt',
            title: '更新时间',
            align: 'center'
        }
    ]
};

export default contentConfig;

export interface IDataType {
    name: string;
    realname: string;
    cellphone: string;
    status: string;
}
