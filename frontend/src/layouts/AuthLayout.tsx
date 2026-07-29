import { Outlet } from 'react-router-dom'
import { ToastContainer } from '../components/Toast'

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <ToastContainer />
      <div className="w-full max-w-[440px]">
        <Outlet />
      </div>
    </div>
  )
}
