import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">
          Gestion des Congés
        </h1>
        <p className="text-sm text-center text-gray-500 mb-6">
          SIAP PHARMA
        </p>
        <Outlet />
      </div>
    </div>
  );
}
