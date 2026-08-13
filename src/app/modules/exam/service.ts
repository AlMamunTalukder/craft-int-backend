import httpStatus from 'http-status';
import { AppError } from '../../error/AppError';
import QueryBuilder from '../../builder/QueryBuilder';
import { Exam, ExamMark } from './model';
import { IExam, IExamMark, IExamMarkItem } from './interface';
import { gradeOf, gpaGradeOf } from './constant';
import { Student } from '../student/student.model';

const computeMarks = (
  items: IExamMarkItem[],
): {
  marks: IExamMarkItem[];
  totalObtained: number;
  totalFull: number;
  gpa: number;
  grade: string;
  result: 'pass' | 'fail';
  remark: string;
} => {
  const computed: IExamMarkItem[] = items.map((item) => {
    const { grade, gradePoint } = gradeOf(item.obtained);
    return {
      ...item,
      grade,
      gradePoint,
      result: grade === 'F' ? ('fail' as const) : ('pass' as const),
    };
  });

  const totalObtained = computed.reduce((s, i) => s + (i.obtained || 0), 0);
  const totalFull = computed.reduce((s, i) => s + (i.fullMarks || 0), 0);
  const anyFail = computed.some((i) => i.result === 'fail');
  const gpa = computed.length
    ? anyFail
      ? 0
      : Number(
          (
            computed.reduce((s, i) => s + i.gradePoint, 0) / computed.length
          ).toFixed(2),
        )
    : 0;
  const { grade, remark } = gpaGradeOf(gpa);

  return {
    marks: computed,
    totalObtained,
    totalFull,
    gpa,
    grade,
    result: anyFail ? 'fail' : 'pass',
    remark,
  };
};

const createExam = async (payload: IExam) => {
  const result = await Exam.create(payload);
  return result;
};

const getAllExams = async (query: Record<string, unknown>) => {
  const queryBuilder = new QueryBuilder(Exam.find().populate('className'), query)
    .search(['name'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await queryBuilder.countTotal();
  const data = await queryBuilder.modelQuery;
  return { meta, data };
};

const getSingleExam = async (id: string) => {
  const result = await Exam.findById(id).populate('className');
  if (!result) throw new AppError(httpStatus.NOT_FOUND, 'Exam not found');
  return result;
};

const updateExam = async (id: string, payload: Partial<IExam>) => {
  const result = await Exam.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  if (!result) throw new AppError(httpStatus.NOT_FOUND, 'Failed to update exam');
  return result;
};

const deleteExam = async (id: string) => {
  await ExamMark.deleteMany({ exam: id });
  const result = await Exam.findByIdAndDelete(id);
  if (!result) throw new AppError(httpStatus.NOT_FOUND, 'Exam not found');
  return result;
};

const publishExam = async (id: string, status: string) => {
  const result = await Exam.findByIdAndUpdate(
    id,
    {
      status,
      publishedAt: status === 'published' ? new Date() : undefined,
    },
    { new: true, runValidators: true },
  );
  if (!result) throw new AppError(httpStatus.NOT_FOUND, 'Exam not found');
  return result;
};

const getMarks = async (query: Record<string, unknown>) => {
  const { examId, className } = query;
  if (!examId) throw new AppError(httpStatus.BAD_REQUEST, 'examId is required');
  const filter: Record<string, unknown> = { exam: examId };
  if (className) filter.className = className;
  const data = await ExamMark.find(filter).populate({
    path: 'student',
    select: 'name studentId studentClassRoll studentPhoto className',
  });
  return { data };
};

const upsertMarks = async (payload: {
  examId: string;
  className: string;
  entries: {
    student: string;
    marks: { subject: string; obtained: number }[];
  }[];
}) => {
  const { examId, className, entries } = payload;
  const exam = await Exam.findById(examId);
  if (!exam) throw new AppError(httpStatus.NOT_FOUND, 'Exam not found');

  const subjectMap = new Map(
    exam.subjects.map((s) => [s.subject, { fullMarks: s.fullMarks, passMarks: s.passMarks }]),
  );

  const results = [];
  for (const entry of entries) {
    const items: IExamMarkItem[] = entry.marks.map((m) => {
      const meta = subjectMap.get(m.subject) || { fullMarks: 100, passMarks: 33 };
      return {
        subject: m.subject,
        obtained: Number(m.obtained) || 0,
        fullMarks: meta.fullMarks,
        passMarks: meta.passMarks,
      } as IExamMarkItem;
    });

    const computed = computeMarks(items);
    const markDoc: Partial<IExamMark> = {
      exam: examId as never,
      student: entry.student as never,
      className: className as never,
      ...computed,
    };

    const saved = await ExamMark.findOneAndUpdate(
      { exam: examId, student: entry.student },
      markDoc,
      { new: true, upsert: true, runValidators: true },
    );
    results.push(saved);
  }

  return { data: results };
};

const getResults = async (query: Record<string, unknown>) => {
  const { examId, className } = query;
  if (!examId) throw new AppError(httpStatus.BAD_REQUEST, 'examId is required');

  const filter: Record<string, unknown> = { exam: examId };
  if (className) filter.className = className;

  const [marks, exam] = await Promise.all([
    ExamMark.find(filter).populate({
      path: 'student',
      select: 'name nameBangla studentId studentClassRoll studentPhoto className',
    }),
    Exam.findById(examId).populate('className'),
  ]);

  const passCount = marks.filter((m) => m.result === 'pass').length;
  const failCount = marks.length - passCount;
  const totalStudents = await Student.countDocuments(
    className ? { className: { $in: [className] } } : {},
  );

  return {
    exam,
    results: marks,
    summary: {
      total: marks.length,
      pass: passCount,
      fail: failCount,
      classStrength: totalStudents,
      passRate: marks.length
        ? Number(((passCount / marks.length) * 100).toFixed(1))
        : 0,
    },
  };
};

export const examServices = {
  createExam,
  getAllExams,
  getSingleExam,
  updateExam,
  deleteExam,
  publishExam,
  getMarks,
  upsertMarks,
  getResults,
};
