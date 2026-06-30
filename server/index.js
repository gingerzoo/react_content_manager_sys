require('dotenv').config(); //读取.env文件配置
const express = require('express');
const app = express();
const authRouter = require('./routes/auth');
const userRouter = require('./routes/user');
const systemRouter = require('./routes/system');



// 解析body
app.use(express.json());


app.use('/api', authRouter);
app.use('/api', systemRouter);
app.use('/api/user', userRouter);




// app.get('/api/test', (req, res) => {
//     res.json({
//         code: 200,
//         message: 'Hello World'
//     })
// })
// app.use('./')

// 定义捕获错误的路由
app.use((error, req, res, next) => {
    res.json({
        code: 500,
        message: error.message || '服务器内部错误'
    })
})



app.listen(8089, () => {
    console.log('Server is running on port 8089');
});

process.on('unhandledRejection', (err) => {
  console.error('未捕获的错误:', err);
});