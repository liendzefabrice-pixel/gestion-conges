import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { branding } from '../config/branding'
import { ToastContainer } from '../components/Toast'
import { Sun, Moon } from 'lucide-react'

export default function AuthLayout() {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
    <div className="min-h-screen flex">
      <ToastContainer />

      {/* Theme toggle */}
      <button
        onClick={() => setDark(!dark)}
        className="fixed top-4 right-4 z-50 flex items-center justify-center h-9 w-9 rounded-xl text-gray-400 hover:text-primary hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700"
        aria-label={dark ? 'Mode clair' : 'Mode sombre'}
      >
        {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
      </button>

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
