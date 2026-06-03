import { useState } from 'react'
import './App.css'

function App() {
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState("")
  const [viewMode, setViewMode] = useState("class") // 'class' or 'teacher'
  
  const [classGrade, setClassGrade] = useState("10")
  const [section, setSection] = useState("A")
  const [teacherId, setTeacherId] = useState("1")
  
  const [scheduleData, setScheduleData] = useState(null)
  const [displayTitle, setDisplayTitle] = useState("")

  // 1. Send Excel to FastAPI
  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) return setStatus("Please select a file first.")

    const formData = new FormData()
    formData.append("file", file)

    setStatus("Uploading and generating schedule...")
    try {
      const response = await fetch("https://time-table-generator-api.onrender.com/generate-schedule/", {
        method: "POST",
        body: formData,
      })
      const data = await response.json()
      setStatus(data.message || data.detail)
    } catch (error) {
      setStatus("Failed to connect to server.")
    }
  }

  // 2. Fetch Schedule (Handles both Class and Teacher)
  const fetchSchedule = async (e) => {
    e.preventDefault()
    setStatus("Fetching schedule...")
    setScheduleData(null)
    
    try {
      let url = ""
      if (viewMode === "class") {
        url = `https://time-table-generator-api.onrender.com/view-schedule/${classGrade}/${section}`
        setDisplayTitle(`Timetable for Class ${classGrade}-${section}`)
      } else {
        url = `https://time-table-generator-api.onrender.com/view-teacher-schedule/${teacherId}`
        setDisplayTitle(`Timetable for Faculty ID: ${teacherId}`)
      }

      const response = await fetch(url)
      if (!response.ok) throw new Error("Schedule not found")
      
      const data = await response.json()
      setScheduleData(data.schedule)
      setStatus("")
    } catch (error) {
      setStatus(`No schedule found for this ${viewMode}.`)
    }
  }

  // Helper to format cell data dynamically
  const getCellData = (day, period) => {
    if (!scheduleData) return null;
    const entry = scheduleData.find(e => e.day_of_week === day && e.period_number === period);
    if (!entry) return "---";
    
    // If viewing class, show subject. If viewing teacher, show where they need to teach.
    return viewMode === "class" 
      ? entry.subject 
      : `${entry.class_grade}-${entry.section} (${entry.subject})`;
  }

  return (
    <div className="container">
      <h1 className="no-print header-title">🏫 Supercharged Timetable Dashboard</h1>
      
      <div className="controls no-print">
        <div className="panel upload-panel">
          <h3>📂 Upload Data</h3>
          <form onSubmit={handleUpload}>
            <input type="file" accept=".xlsx" onChange={(e) => setFile(e.target.files[0])} className="file-input" />
            <button type="submit" className="btn-primary">Generate Master</button>
          </form>
        </div>

        <div className="panel search-panel">
          <h3>🔍 Search Schedule</h3>
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
            {viewMode === "class" ? (
              <>
                <input type="text" value={classGrade} onChange={(e) => setClassGrade(e.target.value)} placeholder="Class (e.g. 10)" required />
                <input type="text" value={section} onChange={(e) => setSection(e.target.value)} placeholder="Section (e.g. A)" required />
              </>
            ) : (
              <input type="number" value={teacherId} onChange={(e) => setTeacherId(e.target.value)} placeholder="Teacher ID (e.g. 1)" required />
            )}
            <button type="submit" className="btn-secondary">View Grid</button>
          </form>
        </div>
      </div>

      {status && <p className="status-message no-print">{status}</p>}

      {scheduleData && (
        <div className="timetable-wrapper">
          <div className="timetable-header">
            <h2>{displayTitle}</h2>
            <button className="btn-print no-print" onClick={() => window.print()}>🖨️ Print Schedule</button>
          </div>
          <div className="timetable">
            <table>
              <thead>
                <tr>
                  <th>Day \ Period</th>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(p => <th key={p}>Period {p}</th>)}
                </tr>
              </thead>
              <tbody>
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((dayName, index) => {
                  const dayNum = index + 1;
                  return (
                    <tr key={dayNum}>
                      <td className="day-name"><strong>{dayName}</strong></td>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(period => {
                        const cellData = getCellData(dayNum, period);
                        const isFilled = cellData !== "---";
                        return (
                          <td key={period} className={isFilled ? "filled" : "empty"}>
                            {cellData}
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