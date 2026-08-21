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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncTeachersWithUsers = void 0;
// scripts/syncTeachersWithUsers.ts
const mongoose_1 = __importDefault(require("mongoose"));
const teacher_model_1 = require("../app/modules/teacher/teacher.model");
const config_1 = __importDefault(require("../app/config"));
const user_model_1 = require("../app/modules/user/user.model");
const syncTeachersWithUsers = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield mongoose_1.default.connect(config_1.default.database_url);
        console.log('Connected to database');
        // Get all teachers
        const teachers = yield teacher_model_1.Teacher.find({});
        console.log(`Found ${teachers.length} teachers`);
        let created = 0;
        let skipped = 0;
        let errors = 0;
        for (const teacher of teachers) {
            try {
                // Check if user already exists
                const existingUser = yield user_model_1.User.findOne({
                    $or: [{ email: teacher.email }, { userId: teacher.teacherId }],
                });
                if (existingUser) {
                    console.log(`User already exists for teacher: ${teacher.email} (${teacher.name})`);
                    skipped++;
                    continue;
                }
                // Create user for teacher
                const userData = {
                    email: teacher.email,
                    password: 'teacher123', // Default password, they should change it on first login
                    name: teacher.name,
                    userId: teacher.teacherId,
                    role: 'teacher',
                    needPasswordChange: true, // Force password change on first login
                    status: 'active',
                    isDeleted: false,
                };
                yield user_model_1.User.create(userData);
                console.log(`✅ Created user for teacher: ${teacher.email} (${teacher.name})`);
                created++;
            }
            catch (error) {
                console.error(`❌ Error creating user for teacher ${teacher.email}:`, error);
                errors++;
            }
        }
        console.log('\n=== Summary ===');
        console.log(`Total teachers: ${teachers.length}`);
        console.log(`✅ Users created: ${created}`);
        console.log(`⏭️  Skipped (already exists): ${skipped}`);
        console.log(`❌ Errors: ${errors}`);
        yield mongoose_1.default.disconnect();
    }
    catch (error) {
        console.error('Sync failed:', error);
    }
});
exports.syncTeachersWithUsers = syncTeachersWithUsers;
