const path = require('node:path');

require('dotenv').config({
    path: path.resolve(__dirname, '../.env'),
    quiet: true
});

const {
    requestAgentTurnStream
} = require('../services/deepseek');

const {
    searchContentsDefinition
} = require('../agent/tools/search-contents');

/**
 * 手动验证流式文本和工具参数拼接。
 * 只请求模型，不执行工具、不查询数据库、不保存消息。
 *
 * 无入参；问题从命令行读取。
 * @returns {Promise<void>} 输出文本片段和最终完整消息。
 * @throws {Error} 模型请求失败时交给入口 catch。
 */
async function main() {
    const question =
        process.argv[2] ||
        '请查找系统中关于 React 的文章。';

    const reply = await requestAgentTurnStream(
        [
            {
                role: 'system',
                content:
                    '你是内容助手。' +
                    '查找系统文章时使用 searchContents 工具，' +
                    '不要编造查询结果。'
            },
            {
                role: 'user',
                content: question
            }
        ],
        [searchContentsDefinition],
        {
            signal: AbortSignal.timeout(60000),

            /**
             * 将增量文本立即写到终端。
             *
             * @param {string} text - 模型本次返回的文本片段。
             * @returns {void} 不返回数据。
             */
            onDelta: text => {
                process.stdout.write(text);
            }
        }
    );

    console.log('\n\n完整助手消息：');
    console.dir(reply, { depth: null });
}

main().catch(error => {
    console.error('单轮流式验证失败：', {
        name: error.name,
        message: error.message
    });

    process.exitCode = 1;
});