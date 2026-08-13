"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HifzClass = void 0;
const mongoose_1 = require("mongoose");
const hifzClassSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true }
}, { timestamps: true });
exports.HifzClass = (0, mongoose_1.model)('HifzClass', hifzClassSchema);
