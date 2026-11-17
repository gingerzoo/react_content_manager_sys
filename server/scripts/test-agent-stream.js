const path = require('node:path');

require('dotenv').config({
    path: path.resolve(__dirname, '../.env'),
    quiet: true
});

const pool = require('../db');

const {
    runAgentStream
} = require('../agent/run-agent');

/**
 * 手动验证完整流式 Agent：模型选择工具、执行查询、继续生成回答。
 * 会调用 DeepSeek，产生 API 费用；不保存会话消息。
 *
 * 无函数入参；问题从命令行参数读取。
 * @returns {Promise<void>} 输出每轮过程、最终答案和工具调用次数。
 * @throws {Error} 请求或执行失败时交给入口 catch。
 */
async function main() {
    const question =
        process.argv[2] ||
        '请找一下系统中关于 React 的文章，列出 ID、标题和摘要。';

    try {
        const result = await runAgentStream(
            question,
            {
                signal: AbortSignal.timeout(60000),

                /**
                 * 标记新的模型请求轮次。
                 *
                 * @param {number} round - 当前轮次，从 1 开始。
                 * @returns {void} 仅输出轮次。
                 */
                onRoundStart: round => {
                    console.log(
                        `\n[第 ${round} 轮模型请求]`
                    );
                },

                /**
                 * 即时展示当前轮文字片段。
                 *
                 * @param {string} text - 模型增量文本。
                 * @returns {void} 仅写入终端。
                 */
                onDelta: text => {
                    process.stdout.write(text);
                },

                /**
                 * 展示工具执行进度。
                 *
                 * @param {{
                 *   phase: 'running' | 'completed',
                 *   name: string
                 * }} status - 工具执行状态。
                 * @returns {void} 仅输出状态。
                 */
                onToolStatus: status => {
                    console.log(
                        `\n[工具 ${status.name}：${status.phase}]`
                    );
                }
            }
        );

        console.log(
            '\n\n[最终回答]\n',
            result.message.content
        );

        console.log(
            '\n工具调用次数：',
            result.toolCallCount
        );
    } finally {
        await pool.end();
    }
}

main().catch(error => {
    console.error('\n流式 Agent 执行失败：', {
        name: error.name,
        message: error.message
    });

    process.exitCode = 1;
});