// 手动付费连通性测试：只发一条短请求，不执行数据库操作。
const path = require('node:path');
const { OpenAI } = require('openai');

require('dotenv').config({
    path: path.resolve(__dirname, '../.env'),
    quiet: true
});

const apiKey = process.env.DEEPSEEK_API_KEY;

if (!apiKey) {
    console.error('缺少 DEEPSEEK_API_KEY');
    process.exit(1);
}

const client = new OpenAI({
    apiKey,
    baseURL: 'https://api.deepseek.com',
    timeout: 30000,
    maxRetries: 0
});

/**
 * 调用一次非流式模型，输出回复和 token 用量；错误由入口 catch 处理。
 *
 * 无入参；所需上下文从闭包或模块作用域读取。
 * @returns {Promise<void>} 手动调用完成并输出结果；不返回数据。
 * @throws {Error} 模型调用或生成失败时交给脚本入口 catch 处理。
 */
async function main() {
    const response = await client.chat.completions.create({
        model: 'deepseek-flash',
        messages: [
            {
                role: 'user',
                content: '请只用一句中文回复：连接测试成功。'
            }
        ],
        thinking: { type: 'disabled' },
        max_tokens: 128
    });

    console.log('模型回复：', response.choices[0]?.message?.content);
    console.log('Token 用量：', response.usage);
}

main().catch(error => {
    console.error('调用失败：', {
        status: error.status,
        code: error.code,
        message: error.message
    });
    process.exitCode = 1;
});
