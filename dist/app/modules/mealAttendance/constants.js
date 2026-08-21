"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AVERAGE_MEAL_RATE = exports.DEFAULT_MEAL_RATES = exports.DEFAULT_DINNER_RATE = exports.DEFAULT_LUNCH_RATE = exports.DEFAULT_BREAKFAST_RATE = void 0;
exports.DEFAULT_BREAKFAST_RATE = 40;
exports.DEFAULT_LUNCH_RATE = 45;
exports.DEFAULT_DINNER_RATE = 80;
exports.DEFAULT_MEAL_RATES = {
    breakfast: exports.DEFAULT_BREAKFAST_RATE,
    lunch: exports.DEFAULT_LUNCH_RATE,
    dinner: exports.DEFAULT_DINNER_RATE,
};
exports.AVERAGE_MEAL_RATE = Math.round((exports.DEFAULT_BREAKFAST_RATE + exports.DEFAULT_LUNCH_RATE + exports.DEFAULT_DINNER_RATE) / 3);
