import { UserRole, Section, User, Assignment, Submission } from './types';

export const INITIAL_USERS: User[] = [
  { 
    id: 'admin-1', 
    username: 'admin', 
    password: 'admin',
    name: 'Research Administrator', 
    role: UserRole.ADMIN, 
    section: Section.NONE 
  }
];

export const INITIAL_ASSIGNMENTS: Assignment[] = [];

export const INITIAL_SUBMISSIONS: Submission[] = [];
