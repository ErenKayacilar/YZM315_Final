// Shared types matching the web client

export enum Role {
    ADMIN = 'ADMIN',
    MANAGER = 'MANAGER',
    INSTRUCTOR = 'INSTRUCTOR',
    ASSISTANT = 'ASSISTANT',
    STUDENT = 'STUDENT',
    GUEST = 'GUEST',
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
    instructorId: number;
    instructor?: {
        name: string;
        email: string;
    };
}

export interface Exam {
    id: number;
    title: string;
    courseId: number;
}

export interface Enrollment {
    id: number;
    userId: number;
    courseId: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    progress?: number;
}
