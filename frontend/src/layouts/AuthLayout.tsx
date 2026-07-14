import { Outlet } from 'react-router-dom'
import { branding } from '../config/branding'
import { ToastContainer } from '../components/Toast'

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex">
      <ToastContainer />
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0B6B3A] via-[#0A5F35] to-[#064B2A] relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 25px 25px, white 1px, transparent 0)', backgroundSize: '50px 50px' }} />
        <div className="relative flex flex-col justify-center px-16">
          <img
            src="/images/Logo.png"
            alt="SIAP PHARMA"
            className="mx-auto w-32 h-32 mb-8"
          />
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight text-center">
            Gestion des Congés
          </h1>
          <p className="text-green-200 text-lg max-w-md text-center">
            {branding.tagline}
          </p>
          <div className="mt-12 flex items-center justify-center gap-6 text-green-200 text-sm">
            <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Congés</span>
            <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Permissions</span>
            <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Planification</span>
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-background">
        <div className="w-full max-w-sm">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
