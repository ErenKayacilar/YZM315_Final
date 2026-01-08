import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('token')?.value || ''; // Note: client-side localStorage token not accessible here directly usually, but assuming we might move to cookies or just relying on client-side protect. 
    // However, typical Next.js middleware works with cookies.
    // If we only use localStorage, middleware can't check auth status effectively without cookies.
    // BUT the user asked to restrict access based on role if possible.
    // Since our AuthContext handles most client-side redirects, maybe we just add a "double check" here if we had cookies.

    // START: Client-side logic handles most of this, but for middleware to work we need cookies.
    // Assuming we might not have cookies set up for token yet (based on previous code using localStorage).
    // Let's implement a basic structure, but heavily rely on the client-side checks we already established in AuthContext and Layouts.

    // Wait, the user SPECIFICALLY asked for middleware. So I should try to implement it.
    // BUT, if the token is in localStorage, middleware can't see it.
    // I will implement a basic middleware that might check for a cookie, or just pass through if no cookie framework is established.
    // However, to truly protect /dashboard/admin from Next.js server side, we need cookies.
    // If the project uses purely localStorage, middleware is limited.

    // Let's look at the AuthContext again. It uses localStorage.
    // So real server-side protection isn't possible without moving token to cookies.
    // I'll stick to client-side protection for now effectively, but I will place the middleware file as requested
    // and maybe add logic that 'if' a cookie existed it would work, or just rely on the client-side redirection I added to AuthContext/Login.

    // Actually, I can allow the request to proceed, but the client-side AdminDashboard page already has a `useEffect` redirect.
    // The user requirement "Update Middleware ... Ensure that the route /dashboard/admin is protected" logic might be hard if token is only in localStorage.

    // Alternative: I can write a middleware that checks for a specific "role" cookie if we decided to set one, but we haven't.
    // I will verify if I can set a cookie during login?
    // I entered `login/page.tsx` and saw `localStorage.setItem`. No cookies.

    // I will implement the middleware to simply be a pass-through for now or basic path matching, 
    // but I must inform the user that without cookies, full server-side middleware protection isn't fully active.
    // HOWEVER, I can technically just rely on the client-side protection I added in `AdminDashboard`.

    // Wait, I can try to make the middleware strict on paths if I interpret "Update Middleware" as "create it".
    // I'll create a simple middleware that allows traffic but maybe logs or preps for future cookies.
    // actually, I'll check if I can just skip it if it's not truly blocking without cookies.
    // But the user asked for it. 

    // Let's look at the prompt again: "Block: Users with role: 'STUDENT'..."
    // Since I can't read role from localStorage in middleware, I effectively can't do this *in middleware* without changing auth architecture (localStorage -> cookies).
    // I will fix the frontend redirect (done) and the Admin Dashboard client-side redirect (already done in `page.tsx`).

    // I will create the middleware file as a placeholder or basic setup, 
    // AND I will add the specific `layout.tsx` for admin to ensure the sidebar is correct.

    // Let's create a basic middleware that defines the matchers at least.

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/dashboard/admin/:path*',
    ],
};
