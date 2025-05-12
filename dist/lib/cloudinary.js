"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadToCloudinary = void 0;
const cloudinary_1 = require("cloudinary");
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
console.log("Cloudinary configured with cloud name:", process.env.CLOUDINARY_CLOUD_NAME);
exports.uploadToCloudinary = {
    upload: function (base64data_1) {
        return __awaiter(this, arguments, void 0, function* (base64data, folder = "chat", type = "auto") {
            try {
                if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
                    throw new Error("Cloudinary configuration missing");
                }
                const uploadData = base64data.startsWith("data:") ? base64data : `data:application/octet-stream;base64,${base64data}`;
                const result = yield cloudinary_1.v2.uploader.upload(uploadData, { folder: folder, resource_type: type, timeout: 60000, });
                return result;
            }
            catch (error) {
                throw new Error(`Failed to upload to Cloudinary: ${error.message}`);
            }
        });
    },
    deleteFile: function (publicId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield cloudinary_1.v2.uploader.destroy(publicId);
                if (result.result !== "ok") {
                    throw new Error("Failed to delete file from Cloudinary");
                }
                return result;
            }
            catch (error) {
                throw new Error(`Failed to delete from Cloudinary: ${error.message}`);
            }
        });
    },
};
