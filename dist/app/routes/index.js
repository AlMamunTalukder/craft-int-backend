"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-unused-vars */
const express_1 = require("express");
const auth_route_1 = require("../modules/Auth/auth.route");
const user_route_1 = require("../modules/user/user.route");
const class_route_1 = require("../modules/class/class.route");
const student_route_1 = require("../modules/student/student.route");
const section_route_1 = require("../modules/section/section.route");
const timeslot_route_1 = require("../modules/timeslot/timeslot.route");
const room_route_1 = require("../modules/room/room.route");
const hometask_route_1 = require("../modules/hometask/hometask.route");
const todaylesson_route_1 = require("../modules/todaylesson/todaylesson.route");
const classreport_route_1 = require("../modules/classreport/classreport.route");
const mealreport_route_1 = require("../modules/mealreport/mealreport.route");
const teacher_route_1 = require("../modules/teacher/teacher.route");
const subject_route_1 = require("../modules/subject/subject.route");
const todaytask_route_1 = require("../modules/todaytask/todaytask.route");
const dailyClassReport_route_1 = require("../modules/dailyclassreport/dailyClassReport.route");
const staff_route_1 = require("../modules/staff/staff.route");
const meta_route_1 = require("../modules/meta/meta.route");
const admission_route_1 = require("../modules/admission/admission.route");
const announcement_route_1 = require("../modules/announcement/announcement.route");
const notification_route_1 = require("../modules/notification/notification.route");
const complaint_route_1 = require("../modules/complaint/complaint.route");
const feedback_route_1 = require("../modules/feedback/feedback.route");
const expense_route_1 = require("../modules/expense/expense.route");
const income_route_1 = require("../modules/income/income.route");
const route_1 = require("../modules/incomeCategory/route");
const route_2 = require("../modules/expenseCategory/route");
const salary_route_1 = require("../modules/salary/salary.route");
const route_3 = require("../modules/hifzClass/route");
const route_4 = require("../modules/hifzSubject/route");
const route_5 = require("../modules/hifzClassReport/route");
const route_6 = require("../modules/investment/route");
const route_7 = require("../modules/loan/route");
const route_8 = require("../modules/nazeraDailyReport/route");
const route_9 = require("../modules/qaidaDailyReport/route");
const route_10 = require("../modules/sunaniReport/route");
const route_11 = require("../modules/sobokiDailyReport/route");
const route_12 = require("../modules/amparaDailyReport/route");
const route_13 = require("../modules/weeklyReport/route");
const route_14 = require("../modules/fees/route");
const route_15 = require("../modules/enrollment/route");
const route_16 = require("../modules/feeCategory/route");
const route_17 = require("../modules/feeAdjustment/route");
const route_18 = require("../modules/payment/route");
const route_19 = require("../modules/receipt/route");
const route_20 = require("../modules/onlineAdmission/route");
const route_21 = require("../modules/mealAttendance/route");
const mealFee_route_1 = require("../modules/mealAttendance/mealFee.route");
const route_22 = require("../modules/exam/route");
const route_23 = require("../modules/routine/route");
const route_24 = require("../modules/certificate/route");
const route_25 = require("../modules/asset/route");
const route_26 = require("../modules/leave/route");
const route_27 = require("../modules/payslip/route");
const route_28 = require("../modules/admissionAnalytics/route");
const router = (0, express_1.Router)();
const moduleRoutes = [
    {
        path: '/user',
        route: user_route_1.userRoutes,
    },
    {
        path: '/auth',
        route: auth_route_1.authRoutes,
    },
    {
        path: '/class',
        route: class_route_1.classRoutes,
    },
    {
        path: '/subject',
        route: subject_route_1.subjectRoutes,
    },
    {
        path: '/student',
        route: student_route_1.studentRoutes,
    },
    {
        path: '/section',
        route: section_route_1.sectionRoutes,
    },
    {
        path: '/timeslot',
        route: timeslot_route_1.timeSlotRoutes,
    },
    {
        path: '/room',
        route: room_route_1.roomRoutes,
    },
    {
        path: '/teacher',
        route: teacher_route_1.teacherRoutes,
    },
    {
        path: '/hometask',
        route: hometask_route_1.homeTaskRoutes,
    },
    {
        path: '/today-lesson',
        route: todaylesson_route_1.todayLessonRoutes,
    },
    {
        path: '/class-report',
        route: classreport_route_1.classReportRoutes,
    },
    {
        path: '/meal-report',
        route: mealreport_route_1.mealReportRoutes,
    },
    {
        path: '/today-task',
        route: todaytask_route_1.todayTaskRoutes,
    },
    {
        path: '/daily-class-report',
        route: dailyClassReport_route_1.dailyClassReportRoutes,
    },
    {
        path: '/announcement',
        route: announcement_route_1.announcementRoutes,
    },
    {
        path: '/staff',
        route: staff_route_1.staffRoutes,
    },
    {
        path: '/notification',
        route: notification_route_1.notificationRoutes,
    },
    {
        path: '/admission',
        route: admission_route_1.admissionRoutes,
    },
    {
        path: '/complaint',
        route: complaint_route_1.complaintRoutes,
    },
    {
        path: '/feedback',
        route: feedback_route_1.feedbackRoutes,
    },
    {
        path: '/expense',
        route: expense_route_1.expenseRoutes,
    },
    {
        path: '/income',
        route: income_route_1.incomeRoutes,
    },
    {
        path: '/income-category',
        route: route_1.incomeCategoryRoutes,
    },
    {
        path: '/expense-category',
        route: route_2.expenseCategoryRoutes,
    },
    {
        path: '/salary',
        route: salary_route_1.salaryRoutes,
    },
    {
        path: '/hifz-class',
        route: route_3.hifzClassRoutes,
    },
    {
        path: '/hifz-subject',
        route: route_4.hifzSubjectRoutes,
    },
    {
        path: '/hifz-class-report',
        route: route_5.hifzClassReportRoutes,
    },
    {
        path: '/investment',
        route: route_6.investmentRoutes,
    },
    {
        path: '/loan',
        route: route_7.loanRoutes,
    },
    {
        path: '/nazera-daily-report',
        route: route_8.nazeraDailyReportRoutes,
    },
    {
        path: '/qaida-daily-report',
        route: route_9.QaidaDailyReportRoutes,
    },
    {
        path: '/sunani-daily-report',
        route: route_10.sunaniReportRoutes,
    },
    {
        path: '/soboki-daily-report',
        route: route_11.sobokiDailyReportRoutes,
    },
    {
        path: '/ampara-daily-report',
        route: route_12.amparaDailyReportRoutes,
    },
    {
        path: '/weekly-report',
        route: route_13.weeklyReportRoutes,
    },
    {
        path: '/fee-category',
        route: route_16.feeCategoryRoutes,
    },
    {
        path: '/fees',
        route: route_14.feesRoutes,
    },
    {
        path: '/enrollment',
        route: route_15.enrollmentRoutes,
    },
    {
        path: '/enrollments',
        route: route_15.enrollmentRoutes,
    },
    {
        path: '/fee-adjustments',
        route: route_17.feeAdjustmentRoutes,
    },
    {
        path: '/payments',
        route: route_18.paymentRoutes,
    },
    {
        path: '/receipts',
        route: route_19.receiptRoutes,
    },
    {
        path: '/admission-application',
        route: route_20.admissionApplicationRoutes,
    },
    {
        path: '/meal-attendance',
        route: route_21.mealAttendanceRoutes,
    },
    {
        path: '/meal-fee',
        route: mealFee_route_1.mealFeeRoute
    },
    {
        path: '/exam',
        route: route_22.examRoutes,
    },
    {
        path: '/routine',
        route: route_23.routineRoutes,
    },
    {
        path: '/certificate',
        route: route_24.certificateRoutes,
    },
    {
        path: '/asset',
        route: route_25.assetRoutes,
    },
    {
        path: '/leave',
        route: route_26.leaveRoutes,
    },
    {
        path: '/payslip',
        route: route_27.payslipRoutes,
    },
    {
        path: '/admission-stats',
        route: route_28.admissionAnalyticsRoutes,
    },
    {
        path: '/meta',
        route: meta_route_1.metaRoute,
    },
];
moduleRoutes.forEach((route) => router.use(route.path, route.route));
exports.default = router;
