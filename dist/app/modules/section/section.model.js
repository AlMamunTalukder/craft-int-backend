"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Section = void 0;
const mongoose_1 = require("mongoose");
const sectionSchema = new mongoose_1.Schema({
    name: {
        type: String,
    }
}, {
    timestamps: true,
});
exports.Section = (0, mongoose_1.model)('Section', sectionSchema);
