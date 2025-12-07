"use client"

import { useState, useEffect, type FormEvent, type ChangeEvent } from "react"
import { supabase } from "../../lib/supabase"
import type { Payment, StudentDropdown } from "../../types"

interface PaymentFormData {
  student_id: string
  amount: string
  meals_added: string
}

interface PaymentStats {
  totalRevenue: number
  totalMeals: number
  averagePrice: number
}

export default function PaymentManagement() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [students, setStudents] = useState<StudentDropdown[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [showForm, setShowForm] = useState<boolean>(false)

  const [formData, setFormData] = useState<PaymentFormData>({
    student_id: "",
    amount: "",
    meals_added: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async (): Promise<void> => {
    setLoading(true)

    // Fetch payments with student data
    const { data: paymentsData, error: paymentsError } = await supabase
      .from("payments")
      .select(`
        *,
        students (reg_number, full_name)
      `)
      .order("payment_date", { ascending: false })

    // Fetch students for dropdown - only select needed fields
    const { data: studentsData, error: studentsError } = await supabase
      .from("students")
      .select("id, reg_number, full_name")
      .order("full_name")

    if (!paymentsError && !studentsError) {
      setPayments(paymentsData || [])
      setStudents(studentsData || [])
    }

    setLoading(false)
  }

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault()

    try {
      const { error } = await supabase.from("payments").insert([
        {
          student_id: formData.student_id,
          amount: Number.parseFloat(formData.amount),
          meals_added: Number.parseInt(formData.meals_added),
        },
      ])

      if (error) throw error

      // Update student's meal balance
      const { data: student } = await supabase
        .from("students")
        .select("meal_balance")
        .eq("id", formData.student_id)
        .single()

      if (student) {
        await supabase
          .from("students")
          .update({
            meal_balance: student.meal_balance + Number.parseInt(formData.meals_added),
          })
          .eq("id", formData.student_id)
      }

      resetForm()
      fetchData()
    } catch (error: any) {
      alert("Error: " + error.message)
    }
  }

  const resetForm = (): void => {
    setFormData({
      student_id: "",
      amount: "",
      meals_added: "",
    })
    setShowForm(false)
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const calculateStats = (): PaymentStats => {
    const totalRevenue = payments.reduce((sum: number, payment: Payment) => {
      const amount = typeof payment.amount === "string" ? Number.parseFloat(payment.amount) : payment.amount
      return sum + amount
    }, 0)

    const totalMeals = payments.reduce((sum: number, payment: Payment) => sum + payment.meals_added, 0)
    const averagePrice = totalMeals > 0 ? totalRevenue / totalMeals : 0

    return { totalRevenue, totalMeals, averagePrice }
  }

  const stats = calculateStats()

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-green-100/50 flex items-center justify-center text-xl">💰</div>
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold text-foreground">shs{stats.totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-100/50 flex items-center justify-center text-xl">🍽️</div>
            <div>
              <p className="text-sm text-muted-foreground">Total Meals Sold</p>
              <p className="text-2xl font-bold text-foreground">{stats.totalMeals}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-purple-100/50 flex items-center justify-center text-xl">📊</div>
            <div>
              <p className="text-sm text-muted-foreground">Average per Meal</p>
              <p className="text-2xl font-bold text-foreground">shs{stats.averagePrice.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl">
        <div className="px-6 py-4 border-b border-border flex justify-between items-center">
          <h2 className="text-lg font-semibold text-foreground">Payment History</h2>
          <button
            onClick={() => setShowForm(true)}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Record Payment
          </button>
        </div>

        {loading ? (
          <div className="p-6 text-center">
            <div className="inline-flex h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary"></div>
            <p className="text-muted-foreground mt-2">Loading payments...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Meals Added
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.map((payment) => {
                  const amount = typeof payment.amount === "string" ? Number.parseFloat(payment.amount) : payment.amount
                  return (
                    <tr key={payment.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-foreground">{payment.students?.full_name}</div>
                        <div className="text-sm text-muted-foreground">{payment.students?.reg_number}</div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-success">${amount.toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm text-foreground">{payment.meals_added} meals</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {new Date(payment.payment_date).toLocaleDateString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {payments.length === 0 && (
              <div className="p-12 text-center">
                <p className="text-4xl mb-2">💰</p>
                <p className="text-muted-foreground">No payment records found</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-2xl shadow-lg max-w-md w-full">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Record New Payment</h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Student</label>
                <select
                  name="student_id"
                  required
                  value={formData.student_id}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                >
                  <option value="">Select a student</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.full_name} ({student.reg_number})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Amount Paid ($)</label>
                <input
                  type="number"
                  name="amount"
                  step="0.01"
                  min="0"
                  required
                  value={formData.amount}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Meals Added</label>
                <input
                  type="number"
                  name="meals_added"
                  min="1"
                  required
                  value={formData.meals_added}
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
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
