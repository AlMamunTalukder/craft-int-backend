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
exports.generateApplicationId = void 0;
const model_1 = require("./model");
const generateApplicationId = () => __awaiter(void 0, void 0, void 0, function* () {
    const lastApplication = yield model_1.AdmissionApplication.findOne()
        .sort({ createdAt: -1 })
        .lean();
    let newId = 'OA-0001';
    if (lastApplication === null || lastApplication === void 0 ? void 0 : lastApplication.applicationId) {
        const lastNumber = parseInt(lastApplication.applicationId.split('-')[1]);
        const nextNumber = (lastNumber + 1).toString().padStart(4, '0');
        newId = `OA-${nextNumber}`;
    }
    return newId;
});
exports.generateApplicationId = generateApplicationId;
