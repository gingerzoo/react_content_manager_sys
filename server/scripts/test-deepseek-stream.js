const path = require('node:path');

require('dotenv').config({
    path: path.resolve(__dirname, '../.env'),
    quiet: true
});

const {
    generateReplyStream
} = require('../services/deepseek');

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