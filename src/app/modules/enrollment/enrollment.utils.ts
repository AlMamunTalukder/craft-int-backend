/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from 'mongoose';

interface IClass {
  _id: mongoose.Types.ObjectId;
  className: string;
  sections?: mongoose.Types.ObjectId[];
  feeStructure?: any[];
  createdAt?: Date;
  updatedAt?: Date;
  __v?: number;
}

export const getClassNameFromClassModel = async (
  classId: string,
  session: mongoose.ClientSession,
): Promise<string> => {
  try {

    const Class = mongoose.model<IClass>('Class');

    const classDoc = await Class.findById(classId)
      .select('className')
      .session(session)
      .lean();

    if (!classDoc) {
      return '';
    }

    if (classDoc.className) {
      return classDoc.className;
    }

    return '';
  } catch (error) {
    console.error('Error fetching class name from Class model:', error);
    return '';
  }
};
