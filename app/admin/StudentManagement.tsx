"use client"

import { useState, useEffect, type FormEvent, type ChangeEvent } from "react"
import { supabase } from "../../lib/supabase"
import type { Student } from "../../types"

interface StudentFormData {
  reg_number: string
  full_name: string
  email: string
  password: string
  meal_balance: number
}

interface StudentStats {
  totalStudents: number
  totalMeals: number
  averageMeals: number
}

export default function StudentManagement() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [showForm, setShowForm] = useState<boolean>(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)

  const [formData, setFormData] = useState<StudentFormData>({
    reg_number: "",
    full_name: "",
    email: "",
    password: "",
    meal_balance: 0,
  })

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async (): Promise<void> => {
    setLoading(true)
    const { data, error } = await supabase.from("students").select("*").order("created_at", { ascending: false })

    if (!error) {
      setStudents(data || [])
    }
    setLoading(false)
  }

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault()

    try {
      if (editingStudent) {
        // Update student
        const { error } = await supabase
          .from("students")
          .update({
            reg_number: formData.reg_number,
            full_name: formData.full_name,
            email: formData.email,
            meal_balance: formData.meal_balance,
          })
          .eq("id", editingStudent.id)

        if (error) throw error
      } else {
        // Create new student
        const { error } = await supabase.from("students").insert([formData])

        if (error) throw error
      }

      resetForm()
      fetchStudents()
    } catch (error: any) {
      alert("Error: " + error.message)
    }
  }

  const resetForm = (): void => {
    setFormData({
      reg_number: "",
      full_name: "",
      email: "",
      password: "",
      meal_balance: 0,
    })
    setEditingStudent(null)
    setShowForm(false)
  }

  const editStudent = (student: Student): void => {
    setFormData({
      reg_number: student.reg_number,
      full_name: student.full_name,
      email: student.email || "",
      password: "", // Don't fill password for security
      meal_balance: student.meal_balance,
    })
    setEditingStudent(student)
    setShowForm(true)
  }

  const deleteStudent = async (studentId: string): Promise<void> => {
    if (!confirm("Are you sure you want to delete this student?")) return

    const { error } = await supabase.from("students").delete().eq("id", studentId)

    if (error) {
      alert("Error: " + error.message)
    } else {
      fetchStudents()
    }
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "meal_balance" ? Number.parseInt(value) || 0 : value,
    }))
  }

  const calculateMealStats = (): StudentStats => {
    const totalStudents = students.length
    const totalMeals = students.reduce((sum, student) => sum + student.meal_balance, 0)
    const averageMeals = totalStudents > 0 ? totalMeals / totalStudents : 0

    return { totalStudents, totalMeals, averageMeals }
  }

  const stats = calculateMealStats()

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-100/50 flex items-center justify-center text-xl">👨‍🎓</div>
            <div>
              <p className="text-sm text-muted-foreground">Total Students</p>
              <p className="text-2xl font-bold text-foreground">{stats.totalStudents}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-green-100/50 flex items-center justify-center text-xl">🍽️</div>
            <div>
              <p className="text-sm text-muted-foreground">Total Meal Balance</p>
              <p className="text-2xl font-bold text-foreground">{stats.totalMeals}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-purple-100/50 flex items-center justify-center text-xl">📊</div>
            <div>
              <p className="text-sm text-muted-foreground">Average per Student</p>
              <p className="text-2xl font-bold text-foreground">{stats.averageMeals.toFixed(1)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl">
        <div className="px-6 py-4 border-b border-border flex justify-between items-center">
          <h2 className="text-lg font-semibold text-foreground">Student List</h2>
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Add Student
          </button>
        </div>

        {loading ? (
          <div className="p-6 text-center">
            <div className="inline-flex h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary"></div>
            <p className="text-muted-foreground mt-2">Loading students...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Meal Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Registered
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-foreground">{student.full_name}</div>
                      <div className="text-sm text-muted-foreground">{student.reg_number}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{student.email || "No email"}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                          student.meal_balance > 5
                            ? "bg-success/10 text-success"
                            : student.meal_balance > 0
                              ? "bg-yellow-100/50 text-yellow-700"
                              : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {student.meal_balance} meals
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(student.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => editStudent(student)}
                        className="text-primary hover:text-primary/80 mr-3 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteStudent(student.id)}
                        className="text-destructive hover:text-destructive/80 font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {students.length === 0 && (
              <div className="p-12 text-center">
                <p className="text-4xl mb-2">👨‍🎓</p>
                <p className="text-muted-foreground">No students found</p>
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
                {editingStudent ? "Edit Student" : "Add New Student"}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Registration Number</label>
                <input
                  type="text"
                  name="reg_number"
                  required
                  value={formData.reg_number}
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
                <label className="block text-sm font-medium text-foreground mb-1">
                  {editingStudent ? "New Password (leave blank to keep)" : "Password"}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Initial Meal Balance</label>
                <input
                  type="number"
                  name="meal_balance"
                  min="0"
                  value={formData.meal_balance}
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
                  {editingStudent ? "Update Student" : "Add Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
