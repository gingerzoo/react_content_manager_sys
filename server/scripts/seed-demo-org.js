// Run from any directory: node server/scripts/seed-demo-org.js
// Adds demo roles/departments only; does not grant permissions or create users.
const path = require('node:path');
require('dotenv').config({
    path: path.resolve(__dirname, '../.env'),
    quiet: true
});
const pool = require('../db');

async function seed() {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const roleNames = ['审核员', '发布运营', '数据分析员', '客服专员'];
        const [roles] = await connection.execute('SELECT id, name FROM roles');
        let nextRoleId = Math.max(0, ...roles.map(role => role.id)) + 1;
        let addedRoles = 0;
        for (const name of roleNames) {
            if (roles.some(role => role.name === name)) continue;
            await connection.execute(
                'INSERT INTO roles (id, name) VALUES (?, ?)',
                [nextRoleId++, name]
            );
            addedRoles++;
        }

        // Parents precede children. Leader names are fictional demo values.
        const departments = [
            { name: '技术研发部', leader: '模拟负责人-研发', parent: null },
            { name: '数据分析部', leader: '模拟负责人-数据', parent: null },
            { name: '客户支持部', leader: '模拟负责人-支持', parent: null },
            { name: '内容编辑组', leader: '模拟负责人-编辑', parent: '内容运营部' },
            { name: '内容审核组', leader: '模拟负责人-审核', parent: '内容运营部' },
            { name: '前端研发组', leader: '模拟负责人-前端', parent: '技术研发部' },
            { name: 'AI应用研发组', leader: '模拟负责人-AI', parent: '技术研发部' },
            { name: '业务分析组', leader: '模拟负责人-业务分析', parent: '数据分析部' },
            { name: '客户服务组', leader: '模拟负责人-客户服务', parent: '客户支持部' },
            // Third-level teams reference the second-level groups above.
            { name: '技术内容小组', leader: '模拟负责人-技术内容', parent: '内容编辑组' },
            { name: '产品内容小组', leader: '模拟负责人-产品内容', parent: '内容编辑组' },
            { name: '事实核查小组', leader: '模拟负责人-事实核查', parent: '内容审核组' },
            { name: '内容质量小组', leader: '模拟负责人-内容质量', parent: '内容审核组' },
            { name: '管理后台小组', leader: '模拟负责人-管理后台', parent: '前端研发组' },
            { name: '移动端小组', leader: '模拟负责人-移动端', parent: '前端研发组' },
            { name: 'Agent开发小组', leader: '模拟负责人-Agent', parent: 'AI应用研发组' },
            { name: '模型评估小组', leader: '模拟负责人-模型评估', parent: 'AI应用研发组' },
            { name: '内容效果分析小组', leader: '模拟负责人-内容分析', parent: '业务分析组' },
            { name: '用户增长分析小组', leader: '模拟负责人-增长分析', parent: '业务分析组' },
            { name: '企业客户小组', leader: '模拟负责人-企业客户', parent: '客户服务组' },
            { name: '个人客户小组', leader: '模拟负责人-个人客户', parent: '客户服务组' }
        ];
        let addedDepartments = 0;
        for (const department of departments) {
            let parentId = null;
            if (department.parent !== null) {
                const [parents] = await connection.execute(
                    'SELECT id FROM departments WHERE name = ?',
                    [department.parent]
                );
                if (parents.length !== 1) {
                    throw new Error(`父部门缺失或重名：${department.parent}`);
                }
                parentId = parents[0].id;
            }

            const [existing] = await connection.execute(
                'SELECT id, parent_id FROM departments WHERE name = ?',
                [department.name]
            );
            if (existing.length > 0) {
                if (existing.length !== 1 || existing[0].parent_id !== parentId) {
                    throw new Error(`已有部门名称或层级冲突：${department.name}`);
                }
                continue;
            }
            await connection.execute(
                'INSERT INTO departments (name, leader, parent_id) VALUES (?, ?, ?)',
                [department.name, department.leader, parentId]
            );
            addedDepartments++;
        }

        await connection.commit();
        console.log(JSON.stringify({ addedRoles, addedDepartments }));
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

seed()
    .catch(error => {
        console.error('模拟组织数据初始化失败：', error.code || error.message);
        process.exitCode = 1;
    })
    .finally(() => pool.end());
