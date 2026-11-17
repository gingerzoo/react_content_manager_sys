const path = require('node:path');

require('dotenv').config({
    path: path.resolve(__dirname, '../.env'),
    quiet: true
});

const pool = require('../db');

const {
    executeSearchContents
} = require('../agent/tools/search-contents');

/**
 * 手动验证工具的数据库搜索和参数校验。
 * 不调用模型，不产生模型费用，也不修改数据库。
 *
 * 无入参。
 * @returns {Promise<void>} 输出搜索和校验结果后结束。
 * @throws {Error} 未预期的执行错误交给入口 catch 处理。
 */
async function main() {
    try {
        const reactResult =
            await executeSearchContents({
                keyword: 'React'
            });

        console.log('React 搜索结果：');
        console.dir(reactResult, { depth: null });

        const emptyResult =
            await executeSearchContents({
                keyword: '不存在的关键词XYZ'
            });

        console.log('无匹配结果：');
        console.dir(emptyResult, { depth: null });

        try {
            await executeSearchContents({
                keyword: '   '
            });
        } catch (error) {
            console.log(
                '空关键词校验：',
                error.message
            );
        }
    } finally {
        // CLI 脚本执行完后关闭连接池，
        // 避免数据库连接让 Node 进程一直不退出。
        await pool.end();
    }
}

main().catch(error => {
    console.error('搜索工具验证失败：', {
        name: error.name,
        code: error.code,
        message: error.message
    });

    process.exitCode = 1;
});