import { SyntheticEvent } from 'react';


// Database types matching your Supabase schema
export interface Student {
  id: string;
  reg_number: string;
  full_name: string;
  email?: string;
  password: string;
  meal_balance: number;
  created_at: string;
}

export interface Staff {
  id: string;
  staff_id: string;
  full_name: string;
  email?: string;
  password: string;
  role: 'staff' | 'admin';
  created_at: string;
}

export interface MealSchedule {
  id: string;
  meal_type: 'breakfast' | 'lunch' | 'supper';
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface QRCode {
  id: string;
  student_id: string;
  meal_type: 'breakfast' | 'lunch' | 'supper';
  qr_data: string;
  is_used: boolean;
  is_valid: boolean;
  expires_at: string;
  created_at: string;
}

export interface MealLog {
  id: string;
  student_id: string;
  staff_id: string;
  meal_type: 'breakfast' | 'lunch' | 'supper';
  served_at: string;
  qr_code_id: string;
  students?: Student;
  staff?: Staff;
}

export interface Payment {
  id: string;
  student_id: string;
  amount: number | string;
  payment_date: string;
  meals_added: number;
  students?: Student;
}

export interface QRCodeData {
  student_id: number;
  reg_number: string;
  meal_type: string;
  timestamp: string;
  expires?: string;
}



export interface ScanResult {
  success: boolean;
  message: string;
  type: 'success' | 'error';
  icon: string;
  student?: Student;
  mealType?: 'breakfast' | 'lunch' | 'supper';
}

// Component Props types
export type UserType = 'student' | 'staff' | 'admin';

export interface LoginProps {
  onLogin: (userData: Student | Staff, userType: UserType) => void;
}

export interface StudentDashboardProps {
  student: Student;
}

export interface StaffDashboardProps {
  staff: Staff;
}

export interface AdminDashboardProps {
  admin: Staff;
}

export interface QRScannerProps {
  staff: Staff;
}

export interface MealLogsProps {
  staff: Staff;
}

// Additional utility types
export interface StudentDropdown {
  id: string;
  reg_number: string;
  full_name: string;
}

export interface StudentFormData {
  reg_number: string;
  full_name: string;
  email: string;
  password: string;
  meal_balance: number;
}

export interface StaffFormData {
  staff_id: string;
  full_name: string;
  email: string;
  password: string;
  role: 'staff' | 'admin';
}

export interface PaymentFormData {
  student_id: string;
  amount: string;
  meals_added: string;
}

// Statistics interfaces
export interface StudentStats {
  totalStudents: number;
  totalMeals: number;
  averageMeals: number;
}

export interface PaymentStats {
  totalRevenue: number;
  totalMeals: number;
  averagePrice: number;
}

export interface MealStats {
  breakfast: number;
  lunch: number;
  supper: number;
  total: number;
}

// Tab navigation types
export type AdminTab = 'students' | 'staff' | 'payments' | 'reports' | 'settings';

export interface AdminTabItem {
  id: AdminTab;
  name: string;
  icon: string;
}

export type StaffTab = 'scanner' | 'logs' | 'reports';

export interface StaffTabItem {
  id: StaffTab;
  name: string;
  icon: string;
  color: 'blue' | 'green' | 'purple';
}

export type StudentTab = 'qr' | 'history';

// Form event types
export interface FormEvent<T = Element> extends SyntheticEvent<T> {
  submitter: HTMLElement | null;
}

// Supabase response types
export interface SupabaseResponse<T> {
  data: T | null;
  error: any;
}

// Toast notification types (if using toast system)
export interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export interface ToastActionElement {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  action?: ToastActionElement;
  variant?: 'default' | 'destructive';
}

// QR Code generation types
export interface QRCodeData {
  qrData: string;
  id: string;
}

// Meal type for consistent usage
export type MealType = 'breakfast' | 'lunch' | 'supper';

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination types
export interface PaginationParams {
  page: number;
  limit: number;
  total: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationParams;
}

// Filter types
export interface DateFilter {
  startDate: string;
  endDate: string;
}

export interface MealFilter {
  mealType?: MealType;
  dateRange?: DateFilter;
  studentId?: string;
}

// Dashboard statistics
export interface DashboardStats {
  totalStudents: number;
  totalStaff: number;
  totalMealsServed: number;
  totalRevenue: number;
  activeMealsToday: number;
}

// Remove the invalid default export - use named imports instead
// You can import specific types like:
// import { Student, Staff, UserType } from '../types'
