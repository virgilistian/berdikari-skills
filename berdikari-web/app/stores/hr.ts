import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Employee {
  id: string
  user_id: string | null
  name: string
  position: string | null
  phone: string | null
  email: string | null
  hired_at: string | null
  status: 'active' | 'inactive'
  note: string | null
}

export interface Attendance {
  id: string
  employee_id: string
  date: string
  clock_in: string | null
  clock_out: string | null
  status: string
  note: string | null
  employee?: { id: string, name: string, position: string | null }
}

export interface LeaveRequest {
  id: string
  employee_id: string
  type: 'annual' | 'sick' | 'other'
  start_date: string
  end_date: string
  reason: string | null
  status: 'pending' | 'approved' | 'rejected'
  decision_note: string | null
  employee?: { id: string, name: string, position: string | null }
  approver?: { id: string, name: string } | null
}

export interface HrSummary {
  active_employees: number
  present_today: number
  pending_leaves: number
}

export interface LeaveQuota {
  id: string
  employee_id: string
  year: number
  type: 'annual' | 'sick' | 'other'
  quota_days: number
  used_days: number
  pending_days: number
  carryover_days: number
  remaining_days: number
  total_available: number
  expires_at: string | null
}

export interface LeaveQuotaSummary {
  quota: LeaveQuota
  approved_history: LeaveRequest[]
  pending_requests: LeaveRequest[]
}

export const useHrStore = defineStore('hr', () => {
  const employees = ref<Employee[]>([])
  const attendance = ref<Attendance[]>([])
  const myToday = ref<Attendance | null>(null)
  const myHistory = ref<Attendance[]>([])
  const myQuota = ref<LeaveQuotaSummary | null>(null)
  const leaves = ref<LeaveRequest[]>([])
  const myLeaves = ref<LeaveRequest[]>([])
  const loading = ref(false)

  // ── Karyawan ────────────────────────────────────────────────────────────────

  async function fetchEmployees(filters: { status?: string, search?: string } = {}) {
    const api = useApi()
    loading.value = true
    try {
      const res = await api<{ data: Employee[] }>('/v1/hr/employees', { query: filters })
      employees.value = res.data
    } finally {
      loading.value = false
    }
  }

  async function createEmployee(data: Partial<Employee>): Promise<Employee> {
    const api = useApi()
    const res = await api<{ data: Employee }>('/v1/hr/employees', { method: 'POST', body: data })
    employees.value = [...employees.value, res.data].sort((a, b) => a.name.localeCompare(b.name))
    return res.data
  }

  async function updateEmployee(id: string, data: Partial<Employee>): Promise<Employee> {
    const api = useApi()
    const res = await api<{ data: Employee }>(`/v1/hr/employees/${id}`, { method: 'PUT', body: data })
    employees.value = employees.value.map(e => (e.id === id ? res.data : e))
    return res.data
  }

  // ── Absensi ─────────────────────────────────────────────────────────────────

  async function fetchAttendance(filters: { employee_id?: string, from?: string, to?: string } = {}) {
    const api = useApi()
    const res = await api<{ data: Attendance[] }>('/v1/hr/attendance', { query: filters })
    attendance.value = res.data
  }

  async function fetchMyAttendance() {
    const api = useApi()
    const res = await api<{ data: { today: Attendance | null, history: Attendance[] } }>('/v1/hr/attendance/me')
    myToday.value = res.data.today
    myHistory.value = res.data.history
  }

  async function clockIn(note?: string): Promise<Attendance> {
    const api = useApi()
    const res = await api<{ data: Attendance }>('/v1/hr/attendance/clock-in', {
      method: 'POST',
      body: note ? { note } : {},
    })
    myToday.value = res.data
    return res.data
  }

  async function clockOut(note?: string): Promise<Attendance> {
    const api = useApi()
    const res = await api<{ data: Attendance }>('/v1/hr/attendance/clock-out', {
      method: 'POST',
      body: note ? { note } : {},
    })
    myToday.value = res.data
    return res.data
  }

  // ── Cuti & izin ─────────────────────────────────────────────────────────────

  async function fetchLeaves(filters: { status?: string, employee_id?: string } = {}) {
    const api = useApi()
    const res = await api<{ data: LeaveRequest[] }>('/v1/hr/leaves', { query: filters })
    leaves.value = res.data
  }

  async function fetchMyLeaves() {
    const api = useApi()
    const res = await api<{ data: LeaveRequest[] }>('/v1/hr/leaves/mine')
    myLeaves.value = res.data
  }

  async function fetchMyQuota(year?: number) {
    const api = useApi()
    try {
      const res = await api<{ data: LeaveQuotaSummary }>('/v1/hr/leaves/quota', {
        query: year ? { year } : {},
      })
      myQuota.value = res.data
    } catch {
      myQuota.value = null
    }
  }

  async function submitLeave(data: { type: string, start_date: string, end_date: string, reason?: string }): Promise<LeaveRequest> {
    const api = useApi()
    const res = await api<{ data: LeaveRequest }>('/v1/hr/leaves', { method: 'POST', body: data })
    myLeaves.value = [res.data, ...myLeaves.value]
    return res.data
  }

  async function decideLeave(id: string, decision: 'approve' | 'reject', note?: string): Promise<LeaveRequest> {
    const api = useApi()
    const res = await api<{ data: LeaveRequest }>(`/v1/hr/leaves/${id}/${decision}`, {
      method: 'POST',
      body: note ? { note } : {},
    })
    leaves.value = leaves.value.map(l => (l.id === id ? res.data : l))
    return res.data
  }

  // ── Ringkasan ───────────────────────────────────────────────────────────────

  async function fetchSummary(): Promise<HrSummary> {
    const api = useApi()
    const res = await api<{ data: HrSummary }>('/v1/hr/summary')
    return res.data
  }

  return {
    employees,
    attendance,
    myToday,
    myHistory,
    leaves,
    myLeaves,
    myQuota,
    loading,
    fetchEmployees,
    createEmployee,
    updateEmployee,
    fetchAttendance,
    fetchMyAttendance,
    clockIn,
    clockOut,
    fetchLeaves,
    fetchMyLeaves,
    fetchMyQuota,
    submitLeave,
    decideLeave,
    fetchSummary,
  }
})
