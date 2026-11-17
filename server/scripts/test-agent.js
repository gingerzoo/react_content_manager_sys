const path = require('node:path');

require('dotenv').config({
    path: path.resolve(__dirname, '../.env'),
    quiet: true
});

const pool = require('../db');
const { runAgent } = require('../agent/run-agent');

/**
 * 手动验证 Agent 的模型选择、工具执行和结果回答。
 * 默认问题可由命令行第一个参数覆盖。
 *
 * 无函数入参；问题从 process.argv[2] 读取。
 * @returns {Promise<void>} 输出最终回答和工具调用次数。
 * @throws {Error} 请求或工具执行失败时交给入口 catch。
 */
async function main() {
    const question =
        process.argv[2] ||
        '请找一下系统中关于 React 的文章，列出文章 ID、标题和摘要。';

    try {
        const result = await runAgent(
            question,
            {
                signal: AbortSignal.timeout(60000)
            }
        );

        console.log(
            '\n实际工具调用次数：',
            result.toolCallCount
        );

        console.log(
            '\n最终回答：\n',
            result.message.content
        );
    } finally {
        await pool.end();
    }
}

main().catch(error => {
    console.error('Agent 验证失败：', {
        name: error.name,
        message: error.message
    });

    process.exitCode = 1;
});