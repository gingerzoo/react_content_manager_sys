import { useMemo, useRef, useState } from 'react';
import {
    Alert,
    App,
    Button,
    Card,
    Form,
    Input,
    Modal,
    Select,
    Space,
    Table,
    Tag,
    TreeSelect
} from 'antd';
import type { TableColumnsType } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '@/hooks/hook';
import { fetchPageEntriesAction } from '@/store/modules/main/main';
import { deleteOrganization, saveOrganization } from '@/service/main/organization';
import type { OrganizationKind, OrganizationRecord } from '@/service/main/organization';
import { getOrganizationError, useOrganizationData } from './use-organization-data';
import OrganizationWrap from './style';

interface EditorValues {
    name: string;
    leader?: string;
    parentId?: number | null;
    menuIds?: number[];
}
interface DepartmentNode {
    title: string;
    value: number;
    disabled: boolean;
    children: DepartmentNode[];
}

/**
 * 复用部门、角色页面交互；只有管理员展示增删改，其他角色只读筛选。
 * @param {{kind: OrganizationKind}} props - 当前组织资源种类。
 * @returns {import('react').ReactElement} 搜索、列表及管理员编辑弹窗。
 */
export default function OrganizationManagement({ kind }: { kind: OrganizationKind }) {
    const isDepartment = kind === 'department';
    const label = isDepartment ? '部门' : '角色';
    const canManage = useAppSelector(state => state.login.userInfo.roleId === 0);
    const dispatch = useAppDispatch();
    const { message, modal } = App.useApp();
    const data = useOrganizationData(kind, canManage);
    const [searchForm] = Form.useForm<{ name: string; leader: string }>();
    const [editorForm] = Form.useForm<EditorValues>();
    // editing=null 表示新增；是否显示弹窗由 editorOpen 独立管理。
    const [editing, setEditing] = useState<OrganizationRecord | null>(null);
    const [editorOpen, setEditorOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const savingRef = useRef(false);
    const deleteConfirmRef = useRef(false);
    const leafMenus = data.menus.filter(menu => menu.parent_id !== null && menu.assignable !== false);

    const departmentTree = useMemo(() => {
        const blocked = new Set<number>();
        if (editing) {
            blocked.add(editing.id);
            // 禁选自己和所有后代，后端会在事务中再进行防环校验。
            let changed = true;
            while (changed) {
                changed = false;
                for (const item of data.departments) {
                    if (
                        item.parentId != null &&
                        blocked.has(item.parentId) &&
                        !blocked.has(item.id)
                    ) {
                        blocked.add(item.id);
                        changed = true;
                    }
                }
            }
        }
        const nodes = new Map<number, DepartmentNode>(
            data.departments.map(item => [
                item.id,
                {
                    title: item.name,
                    value: item.id,
                    disabled: blocked.has(item.id),
                    children: []
                }
            ])
        );
        const roots: DepartmentNode[] = [];
        for (const item of data.departments) {
            const node = nodes.get(item.id)!;
            const parent = item.parentId != null ? nodes.get(item.parentId) : undefined;
            if (parent) parent.children.push(node);
            else roots.push(node);
        }
        return roots;
    }, [data.departments, editing]);

    /**
     * 提交筛选，并回到第一页。
     * @param {{name?: string, leader?: string}} values - 搜索表单输入。
     * @returns {void} 无返回值。
     */
    const handleSearch = (values: { name?: string; leader?: string }) => {
        data.setFilters({ name: values.name?.trim() ?? '', leader: values.leader?.trim() ?? '' });
        data.setPagination(previous => ({ ...previous, page: 1 }));
    };

    /**
     * 打开管理员新增或编辑表单，禁止编辑内置角色。
     * @param {OrganizationRecord | undefined} record - 未传表示新增。
     * @returns {void} 无返回值。
     */
    const handleOpen = (record?: OrganizationRecord) => {
        if (!canManage || data.optionsLoading || data.optionsError) return;
        if (!isDepartment && record && [0, 2].includes(record.id)) return;
        // Modal forceRender 保证表单已连接，打开前先清掉上一条记录。
        editorForm.resetFields();
        editorForm.setFieldsValue({
            name: record?.name ?? '',
            leader: record?.leader ?? '',
            parentId: record?.parentId ?? undefined,
            menuIds: record?.menuIds?.filter(id => leafMenus.some(menu => menu.id === id)) ?? []
        });
        setEditing(record ?? null);
        setEditorOpen(true);
    };

    /**
     * 关闭弹窗，提交期间禁止关闭。
     * @returns {void} 无返回值。
     */
    const handleClose = () => {
        if (!savingRef.current) setEditorOpen(false);
    };

    /**
     * 保存表单并刷新列表、下拉选项；ref 同步阻止重复提交。
     * @returns {Promise<void>} 完成保存或展示具体错误。
     */
    const handleSave = async () => {
        if (!canManage || savingRef.current) return;
        savingRef.current = true;
        setSaving(true);
        try {
            const values = await editorForm.validateFields();
            await saveOrganization(
                kind,
                editing?.id ?? null,
                isDepartment
                    ? {
                          name: values.name.trim(),
                          leader: values.leader?.trim() ?? '',
                          parentId: values.parentId ?? null
                      }
                    : { name: values.name.trim(), menuIds: values.menuIds ?? [] }
            );
            message.success(`${label}${editing ? '编辑' : '创建'}成功`);
            setEditorOpen(false);
            data.refresh();
            void dispatch(fetchPageEntriesAction());
        } catch (error: unknown) {
            if (typeof error === 'object' && error !== null && 'errorFields' in error) return;
            message.error(getOrganizationError(error));
        } finally {
            savingRef.current = false;
            setSaving(false);
        }
    };

    /**
     * 打开删除确认；服务端检查关联数据，失败时保留弹窗。
     * @param {OrganizationRecord} record - 目标记录。
     * @returns {void} 无返回值。
     */
    const handleDelete = (record: OrganizationRecord) => {
        if (!canManage || deleteConfirmRef.current || (!isDepartment && [0, 2].includes(record.id)))
            return;
        deleteConfirmRef.current = true;
        modal.confirm({
            title: `删除${label}“${record.name}”？`,
            content: isDepartment ? '存在子部门或关联用户时无法删除。' : '存在关联用户时无法删除。',
            okText: '删除',
            cancelText: '取消',
            okButtonProps: { danger: true },
            afterClose: () => {
                deleteConfirmRef.current = false;
            },
            onOk: async () => {
                try {
                    await deleteOrganization(kind, record.id);
                    message.success('删除成功');
                    data.refresh();
                    void dispatch(fetchPageEntriesAction());
                } catch (error) {
                    message.error(getOrganizationError(error));
                    throw error;
                }
            }
        });
    };

    const columns: TableColumnsType<OrganizationRecord> = [
        { title: 'ID', dataIndex: 'id', width: 80 },
        { title: `${label}名称`, dataIndex: 'name', width: 180 }
    ];
    if (isDepartment)
        columns.push(
            { title: '负责人', dataIndex: 'leader', render: value => value || '—' },
            { title: '上级部门', dataIndex: 'parentName', render: value => value || '顶级部门' },
            { title: '创建时间', dataIndex: 'createAt', width: 180 },
            { title: '更新时间', dataIndex: 'updateAt', width: 180 }
        );
    else
        columns.push(
            { title: '关联用户数', dataIndex: 'userCount', width: 120 },
            {
                title: '菜单权限',
                dataIndex: 'menuNames',
                render: (names: string[]) =>
                    names?.length ? (
                        <Space wrap>
                            {names.map(name => (
                                <Tag key={name}>{name}</Tag>
                            ))}
                        </Space>
                    ) : (
                        '未配置菜单'
                    )
            }
        );
    if (canManage)
        columns.push({
            title: '操作',
            key: 'actions',
            width: 170,
            render: (_, record) => {
                const builtIn = !isDepartment && [0, 2].includes(record.id);
                return (
                    <Space>
                        <Button
                            type='text'
                            icon={<EditOutlined />}
                            disabled={builtIn || data.optionsLoading || !!data.optionsError}
                            onClick={() => handleOpen(record)}
                        >
                            编辑
                        </Button>
                        <Button
                            type='text'
                            danger
                            icon={<DeleteOutlined />}
                            disabled={builtIn}
                            onClick={() => handleDelete(record)}
                        >
                            删除
                        </Button>
                    </Space>
                );
            }
        });

    return (
        <OrganizationWrap>
            <Card>
                <Form form={searchForm} onFinish={handleSearch}>
                    <div className='search-fields'>
                        <Form.Item name='name' label={`${label}名称`}>
                            <Input
                                allowClear
                                maxLength={isDepartment ? 100 : 50}
                                placeholder={`请输入${label}名称`}
                            />
                        </Form.Item>
                        {isDepartment && (
                            <Form.Item name='leader' label='负责人'>
                                <Input allowClear maxLength={100} placeholder='请输入负责人' />
                            </Form.Item>
                        )}
                    </div>
                    <div className='search-actions'>
                        <Button
                            onClick={() => {
                                searchForm.resetFields();
                                handleSearch({});
                            }}
                        >
                            重置
                        </Button>
                        <Button type='primary' htmlType='submit'>
                            查询
                        </Button>
                    </div>
                </Form>
            </Card>
            <Card
                title={
                    <Space>
                        {label}列表{!canManage && <Tag>只读</Tag>}
                    </Space>
                }
                extra={
                    canManage && (
                        <Button
                            type='primary'
                            icon={<PlusOutlined />}
                            disabled={data.optionsLoading || !!data.optionsError}
                            onClick={() => handleOpen()}
                        >
                            新建{label}
                        </Button>
                    )
                }
            >
                {data.error && (
                    <Alert
                        type='error'
                        showIcon
                        message={data.error}
                        action={
                            <Button size='small' onClick={data.refresh}>
                                重试
                            </Button>
                        }
                    />
                )}
                {canManage && data.optionsError && (
                    <Alert
                        type='warning'
                        showIcon
                        message={`编辑选项加载失败：${data.optionsError}`}
                        action={
                            <Button size='small' onClick={data.refresh}>
                                重试
                            </Button>
                        }
                    />
                )}
                <div className='table-scroll'>
                    <Table<OrganizationRecord>
                        rowKey='id'
                        columns={columns}
                        dataSource={data.rows}
                        loading={data.loading}
                        scroll={{ x: isDepartment ? 1000 : 750 }}
                        pagination={{
                            current: data.pagination.page,
                            pageSize: data.pagination.size,
                            total: data.total,
                            showSizeChanger: true,
                            pageSizeOptions: [4, 6, 8, 10, 20],
                            showTotal: total => `共 ${total} 条`,
                            onChange: (page, size) =>
                                data.setPagination(previous => ({
                                    page: size === previous.size ? page : 1,
                                    size
                                }))
                        }}
                    />
                </div>
            </Card>
            {canManage && (
                <Modal
                    forceRender
                    title={`${editing ? '编辑' : '新建'}${label}`}
                    open={editorOpen}
                    onCancel={handleClose}
                    onOk={() => void handleSave()}
                    confirmLoading={saving}
                    closable={!saving}
                    maskClosable={!saving}
                    keyboard={!saving}
                    okText='保存'
                    cancelText='取消'
                >
                    <Form
                        form={editorForm}
                        layout='vertical'
                        disabled={saving}
                        onFinish={() => void handleSave()}
                    >
                        <Form.Item
                            name='name'
                            label={`${label}名称`}
                            rules={[
                                { required: true, whitespace: true, message: `请输入${label}名称` },
                                { max: isDepartment ? 100 : 50 }
                            ]}
                        >
                            <Input maxLength={isDepartment ? 100 : 50} />
                        </Form.Item>
                        {isDepartment ? (
                            <>
                                <Form.Item name='leader' label='负责人' rules={[{ max: 100 }]}>
                                    <Input maxLength={100} />
                                </Form.Item>
                                <Form.Item
                                    name='parentId'
                                    label='上级部门'
                                    extra='留空表示顶级部门；不能选择自身或子部门。'
                                >
                                    <TreeSelect
                                        allowClear
                                        showSearch
                                        treeNodeFilterProp='title'
                                        treeDefaultExpandAll
                                        treeData={departmentTree}
                                        placeholder='请选择上级部门'
                                    />
                                </Form.Item>
                            </>
                        ) : (
                            <Form.Item
                                name='menuIds'
                                label='菜单权限'
                                extra='自动补齐父菜单；只有超级管理员可增删改组织及用户数据。'
                            >
                                <Select
                                    mode='multiple'
                                    allowClear
                                    options={leafMenus.map(menu => ({
                                        label: menu.name,
                                        value: menu.id
                                    }))}
                                    optionFilterProp='label'
                                    placeholder='请选择可访问的页面'
                                />
                            </Form.Item>
                        )}
                    </Form>
                </Modal>
            )}
        </OrganizationWrap>
    );
}
