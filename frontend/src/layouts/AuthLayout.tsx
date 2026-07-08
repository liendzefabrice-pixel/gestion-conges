import { Outlet } from 'react-router-dom'
import { CalendarCheck } from 'lucide-react'
import { branding } from '../config/branding'

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#2563EB] via-[#1D4ED8] to-[#1E3A5F] relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 25px 25px, white 1px, transparent 0)', backgroundSize: '50px 50px' }} />
        <div className="relative flex flex-col justify-center px-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
              <CalendarCheck className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="text-2xl font-extrabold tracking-tight text-white">{branding.logoText}</div>
              <div className="text-xs font-semibold tracking-widest text-blue-200">{branding.logoSubtext}</div>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            Gérez vos congés<br />simplement.
          </h1>
          <p className="text-blue-200 text-lg max-w-md">
            {branding.tagline} — {branding.companyName}
          </p>
          <div className="mt-12 flex items-center gap-6 text-blue-300 text-sm">
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
