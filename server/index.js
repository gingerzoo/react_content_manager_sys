require('dotenv').config(); //读取.env文件配置
const express = require('express');
const app = express();
const authRouter = require('./routes/auth');
const userRouter = require('./routes/user');
const systemRouter = require('./routes/system');
const agentRouter = require('./routes/agent');


// 解析body
app.use(express.json());
app.use('/api', authRouter);
app.use('/api', systemRouter);
app.use('/api/user', userRouter);
app.use('/api/agent', agentRouter);



// app.get('/api/test', (req, res) => {
//     res.json({
//         code: 200,
//         message: 'Hello World'
//     })
// })
// app.use('./')

// 定义捕获错误的路由
// 必须放在所有业务路由之后。
app.use((error, req, res, next) => {
    // 响应已经开始发送时，交给 Express 后续处理。
    if (res.headersSent) {
        return next(error);
    }

    let status = 500;
    let message = '服务器内部错误，请稍后重试';

    if (error.type === 'entity.parse.failed') {
        status = 400;
        message = '请求体不是有效的 JSON';
    } else if (error.type === 'entity.too.large') {
        status = 413;
        message = '请求内容过大';
    } else {
        switch (error.code) {
            case 'ER_DUP_ENTRY':
                status = 409;
                message = '数据已存在，请检查是否重复';
                break;

            case 'ER_NO_REFERENCED_ROW_2':
                status = 409;
                message = '关联数据不存在或已被删除，请刷新后重试';
                break;

            case 'ER_ROW_IS_REFERENCED_2':
                status = 409;
                message = '该数据仍被其他记录使用，无法删除或修改';
                break;
        }
    }

    // 不打印请求体、密码、token 或完整 SQL。
    console.error('请求处理失败：', {
        method: req.method,
        path: req.path,
        status,
        errorType: error.type || error.name,
        errorCode: error.code
    });

    return res.status(status).json({
        code: status,
        message
    });
});



app.listen(8089, () => {
    console.log('Server is running on port 8089');
});

process.on('unhandledRejection', (err) => {
  console.error('未捕获的错误:', err);
});