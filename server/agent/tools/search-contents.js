const contentModel = require('../../models/content');

/**
 * 提供给模型的工具说明。
 *
 * name：模型请求调用时使用的工具名称。
 * description：帮助模型判断什么时候使用这个工具。
 * parameters：使用 JSON Schema 描述参数结构。
 *
 * 这里只是声明，不会自动执行数据库查询。
 */
const searchContentsDefinition = {
    type: 'function',

    function: {
        name: 'searchContents',

        description:
            '按关键词搜索系统中已发布文章的标题和摘要。' +
            '用户要求查找、推荐系统中的文章时使用。' +
            '每次最多返回 5 篇文章摘要，不包含正文。' +
            '没有匹配结果时返回空列表。' +
            'hasMore 为 true 表示还有未返回的匹配文章。',

        parameters: {
            type: 'object',

            properties: {
                keyword: {
                    type: 'string',
                    description:
                        '从用户问题中提取的简短搜索关键词，' +
                        '例如 React、Vue、权限。' +
                        '使用连续文本匹配，不要把多个关键词用空格拼接。'
                }
            },

            required: ['keyword'],
            additionalProperties: false
        }
    }
};

/**
 * 校验工具参数并执行文章搜索。
 * 参数即使来自模型，也必须按外部输入处理。
 *
 * @param {unknown} args - 解析后的工具参数对象，应只包含 keyword。
 * @returns {Promise<{
 *   items: Array<{id: number, title: string, summary: string}>,
 *   hasMore: boolean
 * }>} 已发布文章摘要及更多结果标记。
 * @throws {TypeError} 参数不是对象、包含未知字段或关键词不合法时抛出。
 * @throws {Error} 数据库查询失败时向上层传播。
 */
async function executeSearchContents(args) {
    if (
        typeof args !== 'object' ||
        args === null ||
        Array.isArray(args)
    ) {
        throw new TypeError('搜索参数必须是对象');
    }

    // 工具目前只接受 keyword，不允许模型额外指定状态或 SQL。
    const hasUnknownField = Object.keys(args).some(
        key => key !== 'keyword'
    );

    if (hasUnknownField) {
        throw new TypeError('搜索参数包含不支持的字段');
    }

    if (typeof args.keyword !== 'string') {
        throw new TypeError('搜索关键词必须是字符串');
    }

    const keyword = args.keyword.trim();

    // 限制过长输入；空字符串不能进入 LOCATE 查询，
    // 否则空关键词可能匹配所有文章。
    if (
        keyword.length === 0 ||
        keyword.length > 50
    ) {
        throw new TypeError(
            '搜索关键词需要为 1–50 个字符'
        );
    }

    return contentModel.searchPublishedContents(
        keyword
    );
}

module.exports = {
    searchContentsDefinition,
    executeSearchContents
};