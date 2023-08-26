const jwt = require('jsonwebtoken');
const User = require('../models/User');

const login = async (req, res, next) => {

    try {
        const { password, email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.send({ status: false, message: 'Invalid email' });
        }
        const matchPassword = user.validatePassword(password);
        if (!matchPassword) {
            return res.send({ status: false, message: 'Invalid Password' });
        }

        delete user.password;
        const expiresIn = process.env.USER_EXPIRE ? Number(process.env.USER_EXPIRE) : 60 * 60;
        const token = jwt.sign({
            user
        },
            process.env.JWT_SECRET,
            { expiresIn });

        const isLocal = process.env.NODE_ENV !== 'production';
        const domain = process.env.COOKIE_DOMAIN || 'azurestaticapps.net';

        console.log('domain==new=', domain);

        if (isLocal) {
            res.cookie('token', token, {
                maxAge: expiresIn * 1000
            });
        } else {
            res.cookie('token', token, {
                maxAge: expiresIn * 1000,
                sameSite: 'none',
                secure: true,
                domain: domain,
                path: '/',
            });
        }

        return res.send({
            status: true,
            message: 'success',
            data: {
                user,
                token
            }
        });
    } catch (err) {
        console.error('Error in login:', err);
        return res.status(500).send({ status: false, message: 'An error occurred' });
    }
}

const logout = async (req, res, next) => {
    try {
        res.clearCookie('token');
        return res.send({
            status: true,
            message: 'Logged out successfully',
            data: null
        });
    } catch (err) {
        return res.status(500).send({ status: false, message: 'An error occurred' });
    }
}

module.exports = { login, logout };
