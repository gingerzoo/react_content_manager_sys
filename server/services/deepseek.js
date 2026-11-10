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
            max_tokens: 4096
        });

        const choice = response.choices[0];
        const content = choice?.message?.content;
        console.log('模型回复统计：', {
            model: response.model,
            finishReason: choice?.finish_reason,
            inputTokens: response.usage?.prompt_tokens,
            outputTokens: response.usage?.completion_tokens,
            contentLength: content?.length ?? 0
        });

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

async function* generateReplyStream(
    messages,
    { signal } = {}
) {
    const apiKey = process.env.DEEPSEEK_API_KEY;

    if (!apiKey) {
        throw new Error('模型服务尚未配置');
    }

    if (!client) {
        client = new OpenAI({
            apiKey,
            baseURL: 'https://api.deepseek.com',
            timeout: 30000,
            maxRetries: 0
        });
    }

    const stream = await client.chat.completions.create(
        {
            model: 'deepseek-flash',
            messages,
            thinking: { type: 'disabled' },
            max_tokens: 4096,
            stream: true
        },
        { signal }
    );

    let finishReason = null;
    let hasText = false;

    for await (const chunk of stream) {
        const choice = chunk.choices[0];

        if (!choice) continue;

        if (choice.finish_reason) {
            finishReason = choice.finish_reason;
        }

        const text = choice.delta?.content;

        if (typeof text === 'string' && text.length > 0) {
            if (text.trim()) {
                hasText = true;
            }

            yield text;
        }
    }

    if (finishReason === 'length') {
        throw new Error('回复达到长度上限，当前内容不完整');
    }

    if (finishReason !== 'stop') {
        throw new Error('模型回复未正常完成，请重试');
    }

    if (!hasText) {
        throw new Error('模型未返回有效回复');
    }
}

module.exports = {
    generateReply,
    generateReplyStream
};