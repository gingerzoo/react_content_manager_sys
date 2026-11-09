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