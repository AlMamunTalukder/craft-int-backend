"use strict";
// import jwt, { JwtPayload } from 'jsonwebtoken';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.createToken = void 0;
// export const createToken = (
//   jwtPayload: { userId: string; role: string },
//   secrete: string,
//   expiresIn: string,
// ) => {
//   return jwt.sign(jwtPayload, secrete, {
//     expiresIn,
//   });
// };
// export const verifyToken = (token: string, secret: string) => {
//   return jwt.verify(token, secret) as JwtPayload;
// };
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const createToken = (jwtPayload, secrete, expiresIn) => {
    const signOptions = { expiresIn };
    return jsonwebtoken_1.default.sign(jwtPayload, secrete, signOptions);
};
exports.createToken = createToken;
const verifyToken = (token, secret) => {
    return jsonwebtoken_1.default.verify(token, secret);
};
exports.verifyToken = verifyToken;
