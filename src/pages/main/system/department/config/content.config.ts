const contentConfig = {
    pageName: 'department',
    header: {
        title: '部门列表',
        btnTitle: '新建部门'
    },
    tableItems: [
        {
            dataIndex: 'name',
            title: '部门名称',
            width: '150px',
            align: 'center'
        },
        {
            dataIndex: 'leader',
            title: '部门领导',
            width: '160px',
            align: 'center'
        },

        {
            dataIndex: 'parentId',
            title: '上级部门',
            width: '150px',
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
