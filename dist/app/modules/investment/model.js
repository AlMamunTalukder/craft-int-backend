"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Investment = void 0;
// investment.model.ts
const mongoose_1 = __importStar(require("mongoose"));
const returnHistorySchema = new mongoose_1.Schema({
    date: { type: Date, required: true },
    amount: {
        type: Number,
        required: true,
        min: [0, 'Return amount must be >= 0'],
    },
    type: {
        type: String,
        enum: ['interest', 'principal', 'dividend', 'capital_gain'],
        required: true
    },
    note: { type: String }
}, { _id: false });
const investmentSchema = new mongoose_1.Schema({
    investmentCategory: {
        type: String,
        enum: ['outgoing', 'incoming'],
        required: true,
    },
    investmentTo: { type: String, trim: true },
    investmentType: { type: String },
    investorName: { type: String, trim: true },
    investorContact: { type: String },
    incomingType: { type: String },
    returnPolicy: { type: String },
    investmentAmount: {
        type: Number,
        required: true,
        min: [1, 'Amount must be > 0'],
    },
    investmentDate: { type: Date, default: Date.now },
    maturityDate: { type: Date },
    returnRate: {
        type: Number,
        min: [0, 'Return rate must be >= 0'],
        default: 0
    },
    status: {
        type: String,
        enum: ['active', 'closed', 'withdrawn', 'matured'],
        default: 'active',
    },
    returnHistory: [returnHistorySchema],
    currentValue: {
        type: Number,
        default: function () {
            return this.investmentAmount;
        }
    },
    totalReturns: {
        type: Number,
        default: 0
    },
    expectedReturn: {
        type: Number,
        default: function () {
            if (!this.returnRate || !this.investmentAmount)
                return 0;
            return this.investmentAmount * (this.returnRate / 100);
        }
    },
    roi: {
        type: Number,
        default: 0
    },
    annualizedReturn: {
        type: Number,
        default: 0
    },
    daysHeld: {
        type: Number,
        default: 0
    }
}, { timestamps: true });
// Pre-save middleware to update all calculations
investmentSchema.pre('save', function (next) {
    // Calculate total returns
    if (this.returnHistory && this.returnHistory.length > 0) {
        this.totalReturns = this.returnHistory.reduce((sum, returnItem) => sum + returnItem.amount, 0);
        this.currentValue = this.investmentAmount + this.totalReturns;
    }
    // Calculate ROI
    if (this.investmentAmount > 0) {
        this.roi = (this.totalReturns / this.investmentAmount) * 100;
    }
    // Calculate days held
    if (this.investmentDate) {
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - this.investmentDate.getTime());
        this.daysHeld = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        // Calculate annualized return if held for at least a day
        if (this.daysHeld > 0) {
            this.annualizedReturn = (Math.pow(1 + (this.roi / 100), 365 / this.daysHeld) - 1) * 100;
        }
    }
    // Update status if maturity date has passed
    if (this.maturityDate && new Date() > this.maturityDate && this.status === 'active') {
        this.status = 'matured';
    }
    next();
});
exports.Investment = mongoose_1.default.models.Investment ||
    mongoose_1.default.model('Investment', investmentSchema);
