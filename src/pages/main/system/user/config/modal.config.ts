import type { IModalConfig } from '@/types/index';
const modalConfig: IModalConfig = {
    pageName: 'users',
    headerName: '新建用户',
    modalItems: [
        {
            type: 'input',
            name: 'name',
            label: '用户名',
            placeholder: '请输入用户名',
            initialValue: 'aaa'
        },
        {
            type: 'input',
            name: 'realname',
            label: '真实姓名',
            placeholder: '请输入真实姓名'
        },
        {
            type: 'input',
            name: 'password',
            label: '密码',
            placeholder: '请设置密码'
        },

        {
            type: 'input',
            name: 'cellphone',
            label: '电话号码',
            placeholder: '请输入查询的手机号码'
        },
        {
            type: 'select',
            name: 'roleId',
            label: '角色',
            placeholder: '请选择角色'
        },
        {
            type: 'select',
            name: 'departmentId',
            label: '部门',
            placeholder: '请选择部门'
        }
    ]
};

export default modalConfig;
