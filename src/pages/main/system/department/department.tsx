import OrganizationManagement from '@/components/organization-management';

/**
 * 展示部门管理，管理员可管理，查看者只读。
 * @returns {import('react').ReactElement} 部门管理页面。
 */
export default function Department() {
    return <OrganizationManagement key='department' kind='department' />;
}
