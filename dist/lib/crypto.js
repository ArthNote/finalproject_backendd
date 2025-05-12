"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decryptData = void 0;
const node_forge_1 = __importDefault(require("node-forge"));
const SECRET_KEY = process.env.ENCRYPTION_KEY;
const decodedPrivateKey = node_forge_1.default.util.decode64(SECRET_KEY);
const privateKey = node_forge_1.default.pki.privateKeyFromPem(decodedPrivateKey);
const decryptData = (encryptedData) => {
    const decodedData = node_forge_1.default.util.decode64(encryptedData);
    const decrypted = privateKey.decrypt(decodedData, "RSA-OAEP");
    return JSON.parse(decrypted);
};
exports.decryptData = decryptData;
