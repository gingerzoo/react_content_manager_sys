const { OpenAI } = require('openai');

let client;

async function generateReply(messages) {
    const apiKey = process.env.DEEPSEEK_API_KEY;

    if (!apiKey) {
        return {
            status: 503,
            error: '模型服务尚未配置'
        };
    }

    try {
        if (!client) {
            client = new OpenAI({
                apiKey,
                baseURL: 'https://api.deepseek.com',
                timeout: 30000,
                maxRetries: 0
            });
        }

        const response = await client.chat.completions.create({
            model: 'deepseek-flash',
            messages,
            thinking: { type: 'disabled' },
            max_tokens: 1024
        });

        const choice = response.choices[0];
        const content = choice?.message?.content;

        if (choice?.finish_reason === 'length') {
            return {
                status: 502,
                error: '回复达到长度上限，请缩小问题范围后重试'
            };
        }

        if (
            typeof content !== 'string' ||
            !content.trim()
        ) {
            return {
                status: 502,
                error: '模型未返回有效回复，请重试'
            };
        }

        return {
            data: {
                role: 'assistant',
                content
            }
        };
    } catch (error) {
        console.error('DeepSeek 调用失败：', {
            status: error.status,
            code: error.code,
            errorType: error.name
        });

        const isTimeout =
            error.name === 'APIConnectionTimeoutError';

        return {
            status: isTimeout ? 504 : 502,
            error: isTimeout
                ? '模型响应超时，请稍后重试'
                : '模型服务暂时不可用，请稍后重试'
        };
    }
}

module.exports = {
    generateReply
};