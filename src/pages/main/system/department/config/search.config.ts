const searchConfig = {
    pageName: 'department',
    formItems: [
        {
            type: 'input',
            name: 'name',

            label: '部门名称',
            placeholder: '请输入查询的部门名称',
            initialValue: 'aaa'
        },
        {
            type: 'input',
            name: 'leader',
            label: '部门领导',
            placeholder: '请输入查询的领导名称'
        },
        {
            type: 'createAt',
            name: 'RangePicker',
            label: '创建时间'
        }
    ]
};

export default searchConfig;
