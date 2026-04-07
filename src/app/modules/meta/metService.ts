import { Admission } from '../admission/admission.model';
import { Class } from '../class/class.model';
import { Expense } from '../expense/expense.model';
import { Income } from '../income/income.model';
import { Investment } from '../investment/model';
import { Loan } from '../loan/model';
import { Salary } from '../salary/salary.model';
import { Staff } from '../staff/staff.model';
import { Student } from '../student/student.model';
import { Teacher } from '../teacher/teacher.model';

const getAllMetaFromDB = async () => {
  const [
    totalTeachers,
    totalStudents,
    totalStaffs,
    totalClasses,
    totalMaleStudents,
    totalFemaleStudents,
    totalNonResidentialStudents,
    totalResidentialStudents,
    totalDayCareStudents,
    classWiseStudentCount,
  ] = await Promise.all([
    Teacher.countDocuments(),
    Student.countDocuments(),
    Staff.countDocuments(),
    Class.countDocuments(),
    Student.countDocuments({ gender: 'Male' }),
    Student.countDocuments({ gender: 'Female' }),
    Student.countDocuments({ studentType: 'Non-residential' }),
    Student.countDocuments({ studentType: 'Day-care' }),
    Student.countDocuments({ studentType: 'Residential' }),
    getClassWiseStudentCount(),
  ]);

  const income = await Income.find();
  const totalIncomeAmount = income.reduce(
    (sum, item) => sum + (item.totalAmount || 0),
    0,
  );
  const totalIncomeAmountBD = totalIncomeAmount.toLocaleString('bn-BD');

  return {
    totalTeachers,
    totalStudents,
    totalStaffs,
    totalClasses,
    totalMaleStudents,
    totalFemaleStudents,
    totalNonResidentialStudents,
    totalResidentialStudents,
    totalDayCareStudents,
    totalIncomeAmount: totalIncomeAmountBD,
    classWiseStudentCount,
  };
};

// Get class-wise student count
const getClassWiseStudentCount = async () => {
  try {
    // First, get all students with populated class names
    const students = await Student.find({
      className: { $exists: true, $ne: [] },
    }).populate('className', 'name className');

    // Create a map to count students per class
    const classCountMap = new Map();

    students.forEach((student) => {
      if (student.className && student.className.length > 0) {
        // Get the first class (since className is an array)
        const classItem = student.className[0];

        // Handle both populated and unpopulated data
        let className = '';
        if (classItem && typeof classItem === 'object') {
          className = classItem.name || classItem.className || 'Unknown Class';
        } else if (typeof classItem === 'string') {
          className = classItem;
        }

        if (className) {
          classCountMap.set(className, (classCountMap.get(className) || 0) + 1);
        }
      }
    });

    // Convert map to array of objects
    const result = Array.from(classCountMap.entries()).map(
      ([className, studentCount]) => ({
        className,
        studentCount,
      }),
    );

    // Sort by class name
    result.sort((a, b) => a.className.localeCompare(b.className));

    return result;
  } catch (error) {
    console.error('Error in getClassWiseStudentCount:', error);
    return [];
  }
};

// Get class-wise student count in object format: { "Class One": 40, "Class Two": 50 }
const getClassWiseStudentCountOnly = async () => {
  const classWiseCount = await getClassWiseStudentCount();

  const formattedResult: Record<string, number> = {};
  classWiseCount.forEach((item) => {
    if (item.className) {
      formattedResult[item.className] = item.studentCount;
    }
  });

  return formattedResult;
};

const getAccountingReport = async () => {
  const [investments, expenses, incomes, salaries, loans, admissions] =
    await Promise.all([
      Investment.find(),
      Expense.find(),
      Income.find(),
      Salary.find(),
      Loan.find(),
      Admission.find(),
    ]);

  // Income & Expense
  const totalIncome = incomes.reduce(
    (sum, inc) => sum + (inc.totalAmount || 0),
    0,
  );
  const totalExpense = expenses.reduce(
    (sum, exp) => sum + (exp.totalAmount || 0),
    0,
  );
  const totalSalary = salaries.reduce(
    (sum, sal) => sum + (sal.netSalary || 0),
    0,
  );
  const totalAdmissionFee = admissions.reduce(
    (sum, adm) => sum + (adm.admissionFee || 0),
    0,
  );

  // Loans
  const takenLoans = loans.filter((l) => l.loan_type === 'taken');
  const givenLoans = loans.filter((l) => l.loan_type === 'given');

  const totalTakenLoan = takenLoans.reduce(
    (sum, l) => sum + (l.loan_amount || 0),
    0,
  );
  const totalGivenLoan = givenLoans.reduce(
    (sum, l) => sum + (l.loan_amount || 0),
    0,
  );

  // Outstanding loans calculation
  const outstandingTakenLoans = takenLoans.reduce(
    (sum, l) => sum + (l.remainingBalance ?? l.loan_amount),
    0,
  );
  const outstandingGivenLoans = givenLoans.reduce(
    (sum, l) => sum + (l.remainingBalance ?? l.loan_amount),
    0,
  );

  // Investments
  const outgoingInvestments = investments.filter(
    (inv) => inv.investmentCategory === 'outgoing',
  );
  const incomingInvestments = investments.filter(
    (inv) => inv.investmentCategory === 'incoming',
  );

  const totalOutgoingInvestment = outgoingInvestments.reduce(
    (sum, inv) => sum + (inv.investmentAmount || 0),
    0,
  );
  const totalIncomingInvestment = incomingInvestments.reduce(
    (sum, inv) => sum + (inv.investmentAmount || 0),
    0,
  );

  // Net Profit
  const netProfit =
    totalIncome + totalAdmissionFee - (totalExpense + totalSalary);

  // Cash Balance
  const cashBalance =
    totalIncome +
    totalAdmissionFee +
    totalTakenLoan +
    totalIncomingInvestment -
    (totalExpense + totalSalary + totalOutgoingInvestment + totalGivenLoan);

  // Assets
  const assets = {
    cash: Math.max(0, cashBalance),
    accountsReceivable: outstandingGivenLoans,
    investments: outgoingInvestments.reduce(
      (sum, inv) => sum + (inv.currentValue || inv.investmentAmount),
      0,
    ),
    fixedAssets: 0,
    total: function () {
      return (
        this.cash +
        this.accountsReceivable +
        this.investments +
        this.fixedAssets
      );
    },
  };

  // Liabilities
  const liabilities = {
    loans: outstandingTakenLoans,
    accountsPayable: 0,
    otherLiabilities: 0,
    total: function () {
      return this.loans + this.accountsPayable + this.otherLiabilities;
    },
  };

  // Equity
  const equity = {
    capital: totalIncomingInvestment,
    retainedEarnings: netProfit,
    total: function () {
      return this.capital + this.retainedEarnings;
    },
  };

  // Equation Check
  const isBalanced = assets.total() === liabilities.total() + equity.total();

  return {
    success: true,
    message: 'Accounting report fetched successfully.',
    data: {
      summary: {
        assets: assets.total(),
        liabilities: liabilities.total(),
        equity: equity.total(),
        income: totalIncome + totalAdmissionFee,
        expense: totalExpense + totalSalary,
        netProfit,
      },
      breakdown: {
        totalIncome,
        totalAdmissionFee,
        totalExpense,
        totalSalary,
        totalOutgoingInvestment,
        totalIncomingInvestment,
        totalTakenLoan,
        totalGivenLoan,
        outstandingTakenLoans,
        outstandingGivenLoans,
      },
      details: {
        assets,
        liabilities,
        equity,
      },
      formulaCheck: {
        'Assets (সম্পদ)': assets.total(),
        'Liabilities (দেনা)': liabilities.total(),
        'Equity (মূলধন)': equity.total(),
        Equation: `Assets (${assets.total()}) = Liabilities (${liabilities.total()}) + Equity (${equity.total()})`,
        'Valid?': isBalanced,
        Difference: assets.total() - (liabilities.total() + equity.total()),
      },
    },
  };
};

export const metaServices = {
  getAllMetaFromDB,
  getAccountingReport,
  getClassWiseStudentCountOnly,
};
