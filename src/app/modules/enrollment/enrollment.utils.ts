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
    // Get the Class model - it has 'className' field
    const Class = mongoose.model<IClass>('Class');

    // Fetch the class document with the className field
    const classDoc = await Class.findById(classId)
      .select('className')
      .session(session)
      .lean();

    if (!classDoc) {
      console.log('Class document not found for ID:', classId);
      return '';
    }

    console.log('Class document found:', classDoc);

    // Return the className field
    if (classDoc.className) {
      return classDoc.className;
    }

    console.log('No className field found in class document');
    return '';
  } catch (error) {
    console.error('Error fetching class name from Class model:', error);
    return '';
  }
};
