"use client"

import type { Student, Staff, UserType } from "@/types"

interface HeaderProps {
  user: Student | Staff
  userType: UserType | null
  onLogout: () => void
}

export default function Header({ user, userType, onLogout }: HeaderProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const getUserRoleLabel = () => {
    switch (userType) {
      case "student":
        return "Student"
      case "staff":
        return "Staff"
      case "admin":
        return "Administrator"
      default:
        return "User"
    }
  }

  const getRoleColor = () => {
    switch (userType) {
      case "student":
        return "bg-blue-500"
      case "staff":
        return "bg-green-500"
      case "admin":
        return "bg-purple-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <header className="justify-items-end sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="flex h-16 items-center justify-between px-6">
        {/* User Info and Actions */}
        <div className="flex items-center gap-4">
          {/* Role Badge */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted">
            <span className={`h-2 w-2 rounded-full ${getRoleColor()}`}></span>
            <span className="text-sm font-medium text-foreground">{getUserRoleLabel()}</span>
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{user.full_name}</p>
              <p className="text-xs text-muted-foreground">{"reg_number" in user ? user.reg_number : user.staff_id}</p>
            </div>
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg text-white font-semibold ${getRoleColor()}`}
            >
              {getInitials(user.full_name)}
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors duration-200"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}
