import { useState } from 'react'
import './App.css'

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8]

const API = "https://time-table-generator-api.onrender.com"

// Icons (inline SVG so no extra deps)
const UploadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
)

const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)

const PrintIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
  </svg>
)

const InfoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)

function App() {
  const [file, setFile]             = useState(null)
  const [status, setStatus]         = useState("")
  const [isError, setIsError]       = useState(false)
  const [loading, setLoading]       = useState(false)
  const [viewMode, setViewMode]     = useState("class")
  const [classGrade, setClassGrade] = useState("10")
  const [section, setSection]       = useState("A")
  const [teacherId, setTeacherId]   = useState("101")
  const [scheduleData, setScheduleData]   = useState(null)
  const [displayTitle, setDisplayTitle]   = useState("")

  const showStatus = (msg, error = false) => {
    setStatus(msg)
    setIsError(error)
  }

  // Upload Excel → generate schedule
  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) return showStatus("Please select a .xlsx file first.", true)

    const formData = new FormData()
    formData.append("file", file)

    setLoading(true)
    showStatus("Uploading and generating schedule…")

    try {
      const res  = await fetch(`${API}/generate-schedule/`, { method: "POST", body: formData })
      const data = await res.json()
      showStatus(data.message || data.detail, !res.ok)
    } catch {
      showStatus("Could not connect to server. Is the API running?", true)
    } finally {
      setLoading(false)
    }
  }

  // Fetch timetable grid
  const fetchSchedule = async (e) => {
    e.preventDefault()
    setScheduleData(null)

    let url, title
    if (viewMode === "class") {
      url   = `${API}/view-schedule/${classGrade}/${section}`
      title = `Class ${classGrade}-${section}`
    } else {
      url   = `${API}/view-teacher-schedule/${teacherId}`
      title = `Faculty ID: ${teacherId}`
    }

    setLoading(true)
    showStatus("Fetching schedule…")

    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setScheduleData(data.schedule)
      setDisplayTitle(title)
      setStatus("")
    } catch {
      showStatus(`No schedule found for this ${viewMode}.`, true)
    } finally {
      setLoading(false)
    }
  }

  const getCellData = (day, period) => {
    if (!scheduleData) return null
    const entry = scheduleData.find(e => e.day_of_week === day && e.period_number === period)
    if (!entry) return null
    return viewMode === "class"
      ? entry.subject
      : `${entry.class_grade}-${entry.section} (${entry.subject})`
  }

  return (
    <div className="container">

      {/* ── Header ── */}
      <header className="header">
        <p className="header-eyebrow">IIIT Dharwad · Academic Scheduler</p>
        <h1>Timetable <span>Dashboard</span></h1>
        <p className="header-sub">Upload your school data, then view any class or faculty schedule instantly.</p>
      </header>

      {/* ── Controls ── */}
      <div className="controls no-print">

        {/* Upload Panel */}
        <div className="panel">
          <p className="panel-label">Step 1</p>
          <h3>Upload School Data</h3>

          <form onSubmit={handleUpload}>
            <div className="file-input-wrapper">
              <label className={`file-input-label ${file ? 'has-file' : ''}`}>
                <UploadIcon />
                <span>{file ? file.name : 'Choose Excel file (.xlsx)'}</span>
                <input
                  type="file"
                  accept=".xlsx"
                  onChange={e => setFile(e.target.files[0])}
                />
              </label>
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Generating…' : 'Generate Master Schedule'}
            </button>
          </form>
        </div>

        {/* Search Panel */}
        <div className="panel">
          <p className="panel-label">Step 2</p>
          <h3>View Schedule</h3>

          <div className="toggle-buttons">
            <button
              className={`btn-toggle ${viewMode === 'class' ? 'active' : ''}`}
              onClick={() => setViewMode("class")}
            >Class View</button>
            <button
              className={`btn-toggle ${viewMode === 'teacher' ? 'active' : ''}`}
              onClick={() => setViewMode("teacher")}
            >Faculty View</button>
          </div>

          <form onSubmit={fetchSchedule}>
            <div className="input-row">
              {viewMode === "class" ? (
                <>
                  <input
                    type="text"
                    value={classGrade}
                    onChange={e => setClassGrade(e.target.value)}
                    placeholder="Class (e.g. 10)"
                    required
                  />
                  <input
                    type="text"
                    value={section}
                    onChange={e => setSection(e.target.value)}
                    placeholder="Section (e.g. A)"
                    required
                  />
                </>
              ) : (
                <input
                  type="number"
                  value={teacherId}
                  onChange={e => setTeacherId(e.target.value)}
                  placeholder="Teacher ID (e.g. 101)"
                  required
                />
              )}
              <button type="submit" className="btn-secondary" disabled={loading}>
                <SearchIcon /> {loading ? '…' : 'View'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── Status Banner ── */}
      {status && (
        <div className={`status-message no-print ${isError ? 'error' : ''}`}>
          {loading ? <span className="status-dot" /> : <InfoIcon />}
          {status}
        </div>
      )}

      {/* ── Timetable Grid ── */}
      {scheduleData && (
        <div className="timetable-wrapper">
          <div className="timetable-header">
            <div>
              <span className="schedule-badge">{viewMode === 'class' ? 'Class Schedule' : 'Faculty Schedule'}</span>
              <h2 style={{ marginTop: 8 }}>{displayTitle}</h2>
            </div>
            <div className="timetable-header-actions no-print">
              <button className="btn-print" onClick={() => window.print()}>
                <PrintIcon /> Print
              </button>
            </div>
          </div>

          <div className="timetable">
            <table>
              <thead>
                <tr>
                  <th>Day / Period</th>
                  {PERIODS.map(p => <th key={p}>P{p}</th>)}
                </tr>
              </thead>
              <tbody>
                {DAYS.map((dayName, i) => {
                  const dayNum = i + 1
                  return (
                    <tr key={dayNum}>
                      <td className="day-name">{dayName}</td>
                      {PERIODS.map(period => {
                        const cell = getCellData(dayNum, period)
                        return (
                          <td key={period} className={cell ? 'filled' : 'empty'}>
                            {cell ?? '·'}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default App