// 手动付费流式测试：直接迭代服务端生成器，不经过浏览器或 Express。
const path = require('node:path');

require('dotenv').config({
    path: path.resolve(__dirname, '../.env'),
    quiet: true
});

const {
    generateReplyStream
} = require('../services/deepseek');

/**
 * 建立最多等待 60 秒的流式请求，逐段写到终端；正常结束后输出完成标记。
 *
 * 无入参；所需上下文从闭包或模块作用域读取。
 * @returns {Promise<void>} 手动调用完成并输出结果；不返回数据。
 * @throws {Error} 模型调用或生成失败时交给脚本入口 catch 处理。
 */
async function main() {
    const messages = [
        {
            role: 'user',
            content: '用三段简短文字介绍虚拟列表。'
        }
    ];

    const stream = generateReplyStream(messages, {
        signal: AbortSignal.timeout(60000)
    });

    for await (const text of stream) {
        process.stdout.write(text);
    }

    process.stdout.write('\n[回复完成]\n');
}

main().catch(error => {
    console.error('\n流式调用失败：', error.message);
    process.exitCode = 1;
});
