"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeAdmin = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_routes_1 = require("../routes/user-routes");
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null)
        return res.sendStatus(401);
    if (user_routes_1.tokenRevocationList.includes(token))
        return res.sendStatus(401);
    jsonwebtoken_1.default.verify(token, 'your_secret_key', (err, user) => {
        if (err)
            return res.sendStatus(403);
        req.user = user;
        req.token = token; // Attach the token to the req object
        next();
    });
}
exports.authenticateToken = authenticateToken;
function authorizeAdmin(req, res, next) {
    if (req.user && req.user.role === 'admin') {
        next();
    }
    else {
        res.status(403).send({ message: "Forbidden: only admins can perform this action" });
    }
}
exports.authorizeAdmin = authorizeAdmin;
