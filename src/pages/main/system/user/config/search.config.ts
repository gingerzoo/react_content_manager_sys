import type { ISearchConfig } from '@/types/index';
const searchConfig: ISearchConfig = {
    pageName: 'users',
    formItems: [
        {
            type: 'input',
            name: 'name',
            label: '用户名',
            placeholder: '请输入查询的用户名称',
            initialValue: 'aaa'
        },
        {
            type: 'input',
            name: 'realname',
            label: '真实姓名',
            placeholder: '请输入查询的真实姓名'
        },
        {
            type: 'input',
            name: 'cellphone',
            label: '手机号码',
            placeholder: '请输入查询的手机号码'
        },
        {
            type: 'select',
            name: 'status',
            label: '状态',
            placeholder: '请输入查询的状态',
            options: [
                {
                    label: '启用',
                    value: '1'
                },
                {
                    label: '禁用',
                    value: '0'
                }
            ]
        },
        {
            type: 'createAt',
            name: 'RangePicker',
            label: '创建时间'
        }
    ]
};

export default searchConfig;
