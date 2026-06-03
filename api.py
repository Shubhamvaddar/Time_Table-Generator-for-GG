from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware  # <-- Make sure this is here!
import shutil
import os

# Import your existing engine logic
from database import setup_database, clear_old_schedule, get_connection
from excel_handler import load_and_validate
from solver import generate_timetable

app = FastAPI(title="Timetable Generator API")

# --- ADD THIS CORS BLOCK ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows any frontend to connect during development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ---------------------------

# Ensure database is set up when the API starts
setup_database()

@app.get("/")
def home():
    return {"message": "Timetable API is running!"}

@app.post("/generate-schedule/")
async def generate_schedule(file: UploadFile = File(...)):
    """
    Endpoint to upload an Excel file and trigger the scheduling algorithm.
    """
    if not file.filename.endswith('.xlsx'):
        raise HTTPException(status_code=400, detail="Only .xlsx files are supported.")

    # 1. Save the uploaded file temporarily
    temp_file_path = f"temp_{file.filename}"
    with open(temp_file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # 2. Clear old data
        clear_old_schedule()

        # 3. Validate the uploaded Excel data
        requirements = load_and_validate(temp_file_path)
        
        if not requirements:
            raise HTTPException(status_code=400, detail="Data validation failed. Ensure all cohorts have exactly 40 periods.")

        # 4. Run the algorithm
        generate_timetable(requirements)
        
        return JSONResponse(content={
            "status": "success",
            "message": "Timetable successfully generated and saved to the database."
        })
        
    finally:
        # 5. Clean up the temporary file so we don't clutter the server
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

@app.get("/view-schedule/{class_grade}/{section}")
def get_class_schedule(class_grade: int, section: str):
    """
    Fetch the generated schedule for a specific class from MySQL.
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    query = """
    SELECT day_of_week, period_number, subject, teacher_id 
    FROM schedule_entries 
    WHERE class_grade = %s AND section = %s
    ORDER BY day_of_week, period_number
    """
    cursor.execute(query, (class_grade, section))
    result = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    if not result:
        raise HTTPException(status_code=404, detail="No schedule found for this class.")
        
    return {"class": f"{class_grade}{section}", "schedule": result}
@app.get("/view-teacher-schedule/{teacher_id}")
def get_teacher_schedule(teacher_id: int):
    """
    Fetch the generated schedule for a specific teacher from MySQL.
    """
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    
    query = """
    SELECT class_grade, section, subject, day_of_week, period_number 
    FROM schedule_entries 
    WHERE teacher_id = %s
    ORDER BY day_of_week, period_number
    """
    cursor.execute(query, (teacher_id,))
    result = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    if not result:
        raise HTTPException(status_code=404, detail="No schedule found for this teacher.")
        
    return {"teacher_id": teacher_id, "schedule": result}