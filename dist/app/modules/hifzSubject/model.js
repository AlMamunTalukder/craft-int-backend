"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HifzSubject = void 0;
const mongoose_1 = require("mongoose");
const hifzSubjectSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
}, { timestamps: true });
exports.HifzSubject = (0, mongoose_1.model)('HifzSubject', hifzSubjectSchema);
