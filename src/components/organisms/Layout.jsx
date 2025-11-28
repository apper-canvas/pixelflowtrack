import { Outlet } from "react-router-dom";
import { useAuth } from "@/layouts/Root";
import React from "react";
import ApperIcon from "@/components/ApperIcon";
import Button from "@/components/atoms/Button";

function Layout() {
  const { logout } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
              <ApperIcon name="ListTodo" className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-800">FlowTrack</h1>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={logout}
            className="flex items-center space-x-2"
          >
            <ApperIcon name="LogOut" className="w-4 h-4" />
            <span>Logout</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout