const router = require('express').Router();

const authController = require('../controllers/auth');

router.post('/login', authController.login);

// 部署默认关闭开放注册。仅在明确开启的环境中接受自助注册。
const isRegistrationEnabled = () => process.env.ALLOW_PUBLIC_REGISTRATION === 'true';

router.get('/auth/config', (_req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json({ code: 200, data: { registrationEnabled: isRegistrationEnabled() } });
});

router.post('/register', (req, res, next) => {
    if (!isRegistrationEnabled()) {
        return res.status(403).json({ code: 403, message: '当前未开放注册，请联系管理员开通账号' });
    }
    return authController.register(req, res, next);
});




module.exports = router;
