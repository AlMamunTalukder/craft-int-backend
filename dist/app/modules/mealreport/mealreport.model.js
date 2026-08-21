"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const mealreport_interface_1 = require("./mealreport.interface");
// Schema for a person's meal selection
const mealParticipantSchema = new mongoose_1.Schema({
    personId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
    },
    mealTypes: [
        {
            type: String,
            enum: Object.values(mealreport_interface_1.MealType),
            required: true,
        },
    ],
    mealCount: {
        type: Number,
        required: true,
        min: 1,
        max: 3,
    },
});
const mealReportSchema = new mongoose_1.Schema({
    date: {
        type: Date,
        required: true,
        index: true,
    },
    students: [mealParticipantSchema],
    teachers: [mealParticipantSchema],
}, {
    timestamps: true,
});
const MealReport = (0, mongoose_1.model)("MealReport", mealReportSchema);
exports.default = MealReport;
