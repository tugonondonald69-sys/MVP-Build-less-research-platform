
export enum UserRole {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT'
}

export enum Section {
  EINSTEIN_G11 = 'Grade 11 - Einstein',
  GALILEI_G12 = 'Grade 12 - Galilei',
  NONE = 'N/A'
}

export interface User {
  id: string;
  username: string;
  password?: string; // Optional for security/mock purposes
  name: string;
  role: UserRole;
  section: Section;
  subject?: string; // For teachers
}

export interface SubmissionFile {
  name: string;
  data: string; // Base64 encoded data
  type: string; // MIME type
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  section: Section;
  teacherId: string;
  teacherName: string;
  subject: string;
  attachments: SubmissionFile[];
  createdAt: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  submittedAt: string;
  files: SubmissionFile[]; 
  textResponse?: string;
  status: 'ON_TIME' | 'LATE';
}

export interface AppState {
  users: User[];
  assignments: Assignment[];
  submissions: Submission[];
}
