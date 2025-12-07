"use client"

import { useState, useEffect, type ChangeEvent } from "react"
import { supabase } from "../../lib/supabase"
import type { MealLogsProps, MealLog } from "../../types"

interface MealStats {
  breakfast: number
  lunch: number
  supper: number
  total: number
}

export default function MealLogs({ staff }: MealLogsProps) {
  const [mealLogs, setMealLogs] = useState<MealLog[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().split("T")[0])

  useEffect(() => {
    fetchMealLogs()
  }, [dateFilter])

  const fetchMealLogs = async (): Promise<void> => {
    setLoading(true)

    const startDate = new Date(dateFilter)
    startDate.setHours(0, 0, 0, 0)

    const endDate = new Date(dateFilter)
    endDate.setHours(23, 59, 59, 999)

    const { data, error } = await supabase
      .from("meal_logs")
      .select(`
        *,
        students (reg_number, full_name),
        staff (full_name)
      `)
      .gte("served_at", startDate.toISOString())
      .lte("served_at", endDate.toISOString())
      .order("served_at", { ascending: false })

    if (!error) {
      setMealLogs(data || [])
    }
    setLoading(false)
  }

  const getMealStats = (): MealStats => {
    const stats: MealStats = {
      breakfast: 0,
      lunch: 0,
      supper: 0,
      total: mealLogs.length,
    }

    mealLogs.forEach((log) => {
      if (stats[log.meal_type as keyof Omit<MealStats, "total">] !== undefined) {
        stats[log.meal_type as keyof Omit<MealStats, "total">]++
      }
    })

    return stats
  }

  const handleDateChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setDateFilter(e.target.value)
  }

  const getMealIcon = (mealType: string): string => {
    switch (mealType) {
      case "breakfast":
        return "🥞"
      case "lunch":
        return "🍲"
      case "supper":
        return "🍽️"
      default:
        return "🍴"
    }
  }

  const stats = getMealStats()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-foreground">Meal Logs</h2>
        <input
          type="date"
          value={dateFilter}
          onChange={handleDateChange}
          className="px-4 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-sm text-muted-foreground">Total Meals</p>
          <p className="text-2xl font-bold text-primary mt-1">{stats.total}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-sm text-muted-foreground">Breakfast</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.breakfast}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-sm text-muted-foreground">Lunch</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.lunch}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-sm text-muted-foreground">Supper</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{stats.supper}</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-flex h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary mb-3"></div>
            <p className="text-muted-foreground">Loading meal logs...</p>
          </div>
        ) : mealLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Meal Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Served By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {mealLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-foreground">{log.students?.full_name}</div>
                      <div className="text-sm text-muted-foreground">{log.students?.reg_number}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full bg-muted">
                        {getMealIcon(log.meal_type)}
                        <span className="capitalize">{log.meal_type}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(log.served_at).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{log.staff?.full_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <p className="text-4xl mb-2">🍽️</p>
            <p className="text-muted-foreground">No meal logs found for this date</p>
          </div>
        )}
      </div>
    </div>
  )
}
