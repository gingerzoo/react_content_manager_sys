const contentModel = require('../../models/content');

const MAX_BODY_LENGTH = 12000;

// 告诉模型这个工具何时使用，以及需要什么参数。
const getContentDefinition = {
    type: 'function',

    function: {
        name: 'getContent',

        description:
            '根据文章 ID 读取一篇已发布文章的正文。' +
            '需要总结、分析文章具体内容时使用。' +
            'ID 应来自用户明确提供或 searchContents 的结果，不能猜测。' +
            '正文最多返回前 12000 个字符。' +
            'truncated=true 表示正文被截断，不是全文。',

        parameters: {
            type: 'object',

            properties: {
                id: {
                    type: 'integer',
                    description: '要读取的文章 ID'
                }
            },

            required: ['id'],
            additionalProperties: false
        }
    }
};

/**
 * 校验文章 ID 并读取已发布文章。
 * 对不存在和未发布的文章返回相同错误，不泄露草稿信息。
 *
 * @param {unknown} args - 模型传入的参数对象，只接受 id 字段。
 * @returns {Promise<
 *   {
 *     article: {
 *       id: number,
 *       title: string,
 *       summary: string,
 *       body: string
 *     },
 *     truncated: boolean
 *   } |
 *   {
 *     error: {
 *       code: string,
 *       message: string
 *     }
 *   }
 * >} 文章内容及截断标记，或未找到的业务错误。
 * @throws {TypeError} 参数结构或文章 ID 不合法时抛出。
 * @throws {Error} 数据库查询失败时向上传播。
 */
async function executeGetContent(args) {
    if (
        typeof args !== 'object' ||
        args === null ||
        Array.isArray(args)
    ) {
        throw new TypeError('文章详情参数必须是对象');
    }

    const hasUnknownField = Object.keys(args).some(
        key => key !== 'id'
    );

    if (hasUnknownField) {
        throw new TypeError('文章详情参数包含不支持的字段');
    }

    // 不自动把字符串转换成数字，
    // 让工具参数与声明的 integer 类型保持一致。
    if (
        !Number.isSafeInteger(args.id) ||
        args.id <= 0 ||
        args.id > 2147483647
    ) {
        throw new TypeError('文章 ID 必须是有效正整数');
    }

    const article =
        await contentModel.findPublishedContentById(
            args.id
        );

    if (!article) {
        return {
            error: {
                code: 'CONTENT_NOT_FOUND',
                message: '文章不存在或不可访问'
            }
        };
    }

    // 按 Unicode 码点切分，避免截断代理对字符。
    const characters = Array.from(article.body);

    return {
        article: {
            id: article.id,
            title: article.title,
            summary: article.summary,
            body: characters
                .slice(0, MAX_BODY_LENGTH)
                .join('')
        },
        truncated:
            characters.length > MAX_BODY_LENGTH
    };
}

module.exports = {
    getContentDefinition,
    executeGetContent
};