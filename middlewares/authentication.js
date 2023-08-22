const jwt = require('jsonwebtoken');

const authentication = (req, res, next) => {

    const excludedRoutes = ['/api/auth/login', '/api/auth/register'];

    if (excludedRoutes.includes(req.path)) {
        return next();
    }

    const token = req.headers.authorization || req.cookies.token;

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized token access' });
    }

    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        req.userData = decodedToken; // Attach the decoded payload to the request object
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token expired or invalid' });
    }
};

module.exports = authentication;
