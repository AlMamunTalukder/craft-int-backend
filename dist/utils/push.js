"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const web_push_1 = __importDefault(require("web-push"));
const config_1 = __importDefault(require("../app/config"));
web_push_1.default.setVapidDetails('mailto:ibrahimsikder5033@gmail.com', config_1.default.VAPID_PUBLIC_KEY || '', config_1.default.VAPID_PRIVATE_KEY || '');
