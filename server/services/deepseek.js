const { OpenAI } = require('openai');

// 惰性创建并复用 SDK 客户端；密钥只从服务端环境变量读取，不能下发浏览器。
let client;

/**
 * 调用 DeepSeek 非流式接口，返回完整助手消息或可展示的业务错误。
 * 上游凭证错误映射为模型服务错误，不转发成本站登录 401。
 *
 * @param {Array<{role: 'user' | 'assistant', content: string} | {role: 'system', content: string}>} messages - 系统指令、历史上下文与本轮问题，按对话顺序排列。
 * @returns {Promise<{data: {role: 'user' | 'assistant', content: string}} | {status: number, error: string}>} 完整助手消息，或 503/502/504 等模型服务业务错误。
 */
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
                // 禁止 SDK 自动重试，由用户决定是否重新发送，避免隐式重复付费调用。
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

/**
 * 异步生成器：yield 每段 delta.content，signal 传到 SDK 取消上游请求。
 * 只允许 stop 且有有效文本的完整结束；截断或异常结束抛错，阻止保存部分问答。
 *
 * @param {Array<{role: 'user' | 'assistant', content: string} | {role: 'system', content: string}>} messages - 发送给模型的有序上下文。
 * @param {Object} [options={}] - 解构的可选请求配置。
 * @param {AbortSignal} [options.signal] - 传给 SDK 的取消信号。
 * @returns {AsyncGenerator<string, void, unknown>} 异步生成器对象；迭代时逐段产出回复，正常结束无返回数据。
 * @yields {string} 原样保留空白的增量文本片段。
 * @throws {Error} 缺少密钥、调用失败、取消、截断或非正常结束时抛出。
 */
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

    // 流中先收到文本、最后才确认完成原因；已经 yield 的片段不代表业务保存成功。
    let finishReason = null;
    // 检测至少一个非空白片段；仍原样输出空白，保留 Markdown 和代码格式。
    let hasText = false;

    for await (const chunk of stream) {
        const choice = chunk.choices[0];

        // 某些分块可能不包含 choices 文本（例如统计信息），跳过即可。
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
