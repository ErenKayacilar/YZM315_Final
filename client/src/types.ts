export enum Role {
    ADMIN = 'ADMIN',
    MANAGER = 'MANAGER',
    INSTRUCTOR = 'INSTRUCTOR',
    ASSISTANT = 'ASSISTANT',
    STUDENT = 'STUDENT',
    GUEST = 'GUEST'
}

export interface User {
    id: number;
    email: string;
    name?: string;
    phoneNumber?: string;
    profileImage?: string;
    role: Role;
}

export interface Course {
    id: number;
    title: string;
    description: string;
    hasLab?: boolean;
    instructorId: number;
    instructor?: {
        name: string;
        email: string;
    };
}

export interface Enrollment {
    id: number;
    userId: number;
    courseId: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    theoryScore?: number;
    labScore?: number;
    user?: {
        id: number;
        name?: string;
        email: string;
    };
}

export interface Exam {
    id: number;
    title: string;
    courseId: number;
}
