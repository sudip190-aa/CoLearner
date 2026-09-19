import React from 'react'
import { Outlet } from 'react-router-dom'
import AppNavbar from './AppNavbar'
import Sidebar from './Sidebar'

export function AppShell({ children, ...props }) {
  return (
    <div className="min-h-screen bg-c-blue-wash" {...props}>
      <AppNavbar />
      <div className="mx-auto flex w-full max-w-content">
        <Sidebar />
        <main className="min-w-0 flex-1 px-6 py-8 pb-24 lg:px-8 lg:pb-8">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  )
}

export default AppShell
