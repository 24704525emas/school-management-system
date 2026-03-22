const jwt = require('jsonwebtoken');

const authMiddleware = (requiredRoles = []) => {
    return (req, res, next) => {
        const token = req.headers['authorization'];

        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(403).json({ message: 'Failed to authenticate token' });
            }

            req.user = decoded;

            if (requiredRoles.length && !requiredRoles.includes(decoded.role)) {
                return res.status(403).json({ message: 'Access denied: insufficient role' });
            }

            next();
        });
    };
};

module.exports = authMiddleware;
