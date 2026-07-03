import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">Gestion des Congés</h1>
          <p className="text-sm text-gray-500">SIAP PHARMA</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
