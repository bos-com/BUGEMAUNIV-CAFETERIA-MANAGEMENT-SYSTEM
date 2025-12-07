"use client"

import { useState, useEffect, type FormEvent, type ChangeEvent } from "react"
import { supabase } from "../../lib/supabase"
import type { Staff } from "../../types"

interface StaffFormData {
  staff_id: string
  full_name: string
  email: string
  password: string
  role: "staff" | "admin"
}

export default function StaffManagement() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [showForm, setShowForm] = useState<boolean>(false)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)

  const [formData, setFormData] = useState<StaffFormData>({
    staff_id: "",
    full_name: "",
    email: "",
    password: "",
    role: "staff",
  })

  useEffect(() => {
    fetchStaff()
  }, [])

  const fetchStaff = async (): Promise<void> => {
    setLoading(true)
    const { data, error } = await supabase.from("staff").select("*").order("created_at", { ascending: false })

    if (!error) {
      setStaff(data || [])
    }
    setLoading(false)
  }

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault()

    try {
      if (editingStaff) {
        // Update staff
        const updateData: Partial<StaffFormData> = {
          staff_id: formData.staff_id,
          full_name: formData.full_name,
          email: formData.email,
          role: formData.role,
        }

        // Only update password if provided
        if (formData.password) {
          updateData.password = formData.password
        }

        const { error } = await supabase.from("staff").update(updateData).eq("id", editingStaff.id)

        if (error) throw error
      } else {
        // Create new staff
        const { error } = await supabase.from("staff").insert([formData])

        if (error) throw error
      }

      resetForm()
      fetchStaff()
    } catch (error: any) {
      alert("Error: " + error.message)
    }
  }

  const resetForm = (): void => {
    setFormData({
      staff_id: "",
      full_name: "",
      email: "",
      password: "",
      role: "staff",
    })
    setEditingStaff(null)
    setShowForm(false)
  }

  const editStaff = (staffMember: Staff): void => {
    setFormData({
      staff_id: staffMember.staff_id,
      full_name: staffMember.full_name,
      email: staffMember.email || "",
      password: "",
      role: staffMember.role,
    })
    setEditingStaff(staffMember)
    setShowForm(true)
  }

  const deleteStaff = async (staffId: string): Promise<void> => {
    if (!confirm("Are you sure you want to delete this staff member?")) return

    const { error } = await supabase.from("staff").delete().eq("id", staffId)

    if (error) {
      alert("Error: " + error.message)
    } else {
      fetchStaff()
    }
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-2xl">
        <div className="px-6 py-4 border-b border-border flex justify-between items-center">
          <h2 className="text-lg font-semibold text-foreground">Staff Management</h2>
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Add Staff
          </button>
        </div>

        {loading ? (
          <div className="p-6 text-center">
            <div className="inline-flex h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary"></div>
            <p className="text-muted-foreground mt-2">Loading staff...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Staff Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Registered
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {staff.map((staffMember) => (
                  <tr key={staffMember.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-foreground">{staffMember.full_name}</div>
                      <div className="text-sm text-muted-foreground">{staffMember.staff_id}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{staffMember.email || "No email"}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                          staffMember.role === "admin"
                            ? "bg-purple-100/50 text-purple-700"
                            : "bg-green-100/50 text-green-700"
                        }`}
                      >
                        {staffMember.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(staffMember.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => editStaff(staffMember)}
                        className="text-primary hover:text-primary/80 mr-3 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteStaff(staffMember.id)}
                        className="text-destructive hover:text-destructive/80 font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {staff.length === 0 && (
              <div className="p-12 text-center">
                <p className="text-4xl mb-2">👨‍💼</p>
                <p className="text-muted-foreground">No staff members found</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-2xl shadow-lg max-w-md w-full">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">
                {editingStaff ? "Edit Staff Member" : "Add New Staff Member"}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Staff ID</label>
                <input
                  type="text"
                  name="staff_id"
                  required
                  value={formData.staff_id}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Full Name</label>
                <input
                  type="text"
                  name="full_name"
                  required
                  value={formData.full_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                >
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {editingStaff ? "New Password (leave blank to keep)" : "Password"}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-sm font-medium text-foreground bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:opacity-90 transition-opacity"
                >
                  {editingStaff ? "Update Staff" : "Add Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
