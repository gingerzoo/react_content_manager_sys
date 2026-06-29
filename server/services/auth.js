const authModel = require('../models/auth');
const jwt = require('jsonwebtoken');


async function login(name, password) {
     const user = await authModel.findByCredential(name, password);
    if (!user) {
        return null;
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    return {
        token,
        id: user.id,
        username: user.username
    }
}

async function register(name, password) {
    const existingUser = await authModel.findByUsername(name);
    if (existingUser) {
        return null;
    }

    const result = await authModel.creatUser(name, password);
    return result
}


module.exports = {
    login,
    register
}