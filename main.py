from database import setup_database, clear_old_schedule
from excel_handler import load_and_validate
from solver import generate_timetable

def run_application():
    print("--- High School Timetable Generator ---")
    
    # 1. Ensure MySQL tables exist
    setup_database()
    
    # 2. Clear out the previous semester's schedule from MySQL
    clear_old_schedule()
    
    # 3. Read and validate the Excel file
    # Note: Make sure you ran 'create_excel.py' first!
    requirements = load_and_validate("school_data.xlsx")
    
    # 4. Run the algorithm
    if requirements:
        generate_timetable(requirements)
        print("Process Complete. Check your MySQL database to see the results!")
    else:
        print("Process Aborted due to validation errors.")

if __name__ == "__main__":
    run_application()