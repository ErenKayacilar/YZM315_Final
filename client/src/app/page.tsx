'use client';

import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user, logout } = useAuth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <h1 className="text-4xl font-bold">LMS Platform</h1>
        <div>
          {user ? (
            <div className="flex gap-4 items-center">
              <span>Hosgeldin, {user.name} ({user.role})</span>
              <Link
                href={user.role === 'INSTRUCTOR' ? '/dashboard/instructor' : '/dashboard/student'}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Dashboard
              </Link>
              <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded">
                Cikis
              </button>
            </div>
          ) : (
            <div className="flex gap-4">
              <Link href="/login" className="bg-blue-600 text-white px-4 py-2 rounded">
                Giris Yap
              </Link>
              <Link href="/register" className="bg-green-600 text-white px-4 py-2 rounded">
                Kayit Ol
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="mt-10 text-center">
        <p className="text-xl">En iyi ogrenim deneyimi icin dogru adres.</p>
      </div>
    </main>
  );
}
