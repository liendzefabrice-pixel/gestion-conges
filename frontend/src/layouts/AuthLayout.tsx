import { Outlet } from 'react-router-dom'
import { ToastContainer } from '../components/Toast'

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center px-4">
      <ToastContainer />
      <div className="w-full max-w-[440px]">
        <Outlet />
      </div>
    </div>
  )
}
