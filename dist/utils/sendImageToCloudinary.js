"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudinaryConfig = exports.upload = exports.sendImageToCloudinary = void 0;
const cloudinary_1 = require("cloudinary");
const fs_1 = __importDefault(require("fs"));
const multer_1 = __importDefault(require("multer"));
const config_1 = __importDefault(require("../app/config"));
const path_1 = __importDefault(require("path"));
cloudinary_1.v2.config({
    cloud_name: config_1.default.cloudinary_name,
    api_key: config_1.default.cloudinary_api_key,
    api_secret: config_1.default.cloudinary_secret,
});
const sendImageToCloudinary = (imageName, path, folder) => {
    return new Promise((resolve, reject) => {
        cloudinary_1.v2.uploader.upload(path, {
            public_id: imageName.trim(),
            folder: `news/${folder}`,
        }, function (error, result) {
            if (error) {
                reject(error);
            }
            if (result) {
                resolve(result);
            }
            // Asynchronously delete the file after upload
            fs_1.default.unlink(path, (err) => {
                if (err) {
                    console.log('Error deleting file:', err);
                }
                else {
                    console.log('File deleted successfully.');
                }
            });
        });
    });
};
exports.sendImageToCloudinary = sendImageToCloudinary;
// Multer storage setup
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path_1.default.join(process.cwd(), '/uploads/');
        if (!fs_1.default.existsSync(uploadPath)) {
            fs_1.default.mkdirSync(uploadPath);
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    },
});
// Multer configuration: Handle 'images' field with a limit of 10 images
exports.upload = (0, multer_1.default)({
    storage: storage,
}).array('images', 10);
exports.cloudinaryConfig = cloudinary_1.v2;
