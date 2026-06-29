

const jwt = require('jsonwebtoken');

// 鉴权中间价
function authMiddleware(req, res, next) {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            code: 401,
            message: '未授权'
        });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({
            code: 401,
            message: 'token格式错误'
        });
    }

    try {
         const token = parts[1];

         const decoded = jwt.verify(token, process.env.JWT_SECRET);

         req.user = decoded;
         next();


    }
    catch {
        return res.status(401).json({
            code: 401,
            message: 'token无效'
        });

    }








    //拿到token

}


module.exports = authMiddleware;