const modelConfig = {
    pageName: 'department',
    headerName: '部门',
    modalItems: [
        {
            type: 'input',
            name: 'name',
            label: '部门名称',
            placeholder: '请输入部门名称',
            initialValue: 'aaab'
        },
        {
            type: 'input',
            name: 'leader',
            label: '部门领导',
            placeholder: '请输入部门领导'
        },
        {
            type: 'select',
            name: 'parentId',
            label: '上级部门',
            placeholder: '请选择上级部门'
        }
    ]
};

export default modelConfig;
