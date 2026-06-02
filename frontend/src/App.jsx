import { useState } from 'react'
import './App.css'

function App() {
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState("")
  const [classGrade, setClassGrade] = useState("10")
  const [section, setSection] = useState("A")
  const [scheduleData, setScheduleData] = useState(null)

  // 1. Send Excel to FastAPI
  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) return setStatus("Please select a file first.")

    const formData = new FormData()
    formData.append("file", file)

    setStatus("Uploading and generating...")
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

  // 2. Fetch Schedule from FastAPI
  const fetchSchedule = async (e) => {
    e.preventDefault()
    setStatus("Fetching schedule...")
    try {
      const response = await fetch(`https://time-table-generator-api.onrender.com/view-schedule/${classGrade}/${section}`)
      if (!response.ok) throw new Error("Schedule not found")
      
      const data = await response.json()
      setScheduleData(data.schedule)
      setStatus(`Showing schedule for Class ${classGrade}-${section}`)
    } catch (error) {
      setStatus("No schedule found for this class.")
      setScheduleData(null)
    }
  }

  // Helper to find a subject for a specific grid cell
  const getSubjectForSlot = (day, period) => {
    if (!scheduleData) return null;
    const entry = scheduleData.find(e => e.day_of_week === day && e.period_number === period);
    return entry ? entry.subject : "---";
  }

  return (
    <div className="container">
      <h1>🏫 Automated Timetable Dashboard</h1>
      
      <div className="controls">
        <div className="panel">
          <h3>1. Generate Master Schedule</h3>
          <form onSubmit={handleUpload}>
            <input type="file" accept=".xlsx" onChange={(e) => setFile(e.target.files[0])} />
            <button type="submit">Upload & Generate</button>
          </form>
        </div>

        <div className="panel">
          <h3>2. View Class Timetable</h3>
          <form onSubmit={fetchSchedule}>
            <input type="text" value={classGrade} onChange={(e) => setClassGrade(e.target.value)} placeholder="Class (e.g. 10)" required />
            <input type="text" value={section} onChange={(e) => setSection(e.target.value)} placeholder="Section (e.g. A)" required />
            <button type="submit">View Grid</button>
          </form>
        </div>
      </div>

      <p className="status-message">{status}</p>

      {/* 3. The Visual Grid */}
      {scheduleData && (
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
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(period => (
                      <td key={period} className={getSubjectForSlot(dayNum, period) !== "---" ? "filled" : "empty"}>
                        {getSubjectForSlot(dayNum, period)}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default App