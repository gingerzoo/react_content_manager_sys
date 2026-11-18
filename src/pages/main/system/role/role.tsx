import OrganizationManagement from '@/components/organization-management';

/**
 * 展示角色及菜单授权管理，非管理员只读。
 * @returns {import('react').ReactElement} 角色管理页面。
 */
export default function Role() {
    return <OrganizationManagement key='role' kind='role' />;
}
