import mysql.connector

# Update these with your MySQL credentials

DB_CONFIG = {
    "unix_socket": "/var/lib/mysql/mysql.sock", # Bypasses all IP/Port issues
    "user": "root",
    "password": "password123", # Make sure this matches what you set!
    "database": "timetable_db"
}

def get_connection():
    return mysql.connector.connect(**DB_CONFIG)

def setup_database():
    """Creates tables if they do not exist."""
    # Create a temporary config without the 'database' key 
    # so we can connect to the server globally to create it.
    init_config = DB_CONFIG.copy()
    if "database" in init_config:
        del init_config["database"]
        
    # Connect using ** unpacking, which automatically handles unix_socket OR host
    conn = mysql.connector.connect(**init_config)
    cursor = conn.cursor()
    
    # Create DB if not exists
    cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_CONFIG['database']}")
    cursor.execute(f"USE {DB_CONFIG['database']}")
    
    # Create Schedule Table
    table_query = """
    CREATE TABLE IF NOT EXISTS schedule_entries (
        entry_id INT AUTO_INCREMENT PRIMARY KEY,
        class_grade INT,
        section VARCHAR(10),
        subject VARCHAR(100),
        teacher_id INT,
        day_of_week INT,
        period_number INT,
        UNIQUE KEY unique_teacher_slot (teacher_id, day_of_week, period_number),
        UNIQUE KEY unique_cohort_slot (class_grade, section, day_of_week, period_number)
    )
    """
    cursor.execute(table_query)
    conn.commit()
    cursor.close()
    conn.close()
    print("Database setup complete.")


    
def clear_old_schedule():
    """Wipes the old schedule before generating a new one."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("TRUNCATE TABLE schedule_entries")
    conn.commit()
    conn.close()

def save_schedule_entry(class_grade, section, subject, teacher_id, day, period):
    conn = get_connection()
    cursor = conn.cursor()
    query = """
    INSERT INTO schedule_entries 
    (class_grade, section, subject, teacher_id, day_of_week, period_number) 
    VALUES (%s, %s, %s, %s, %s, %s)
    """
    cursor.execute(query, (class_grade, section, subject, teacher_id, day, period))
    conn.commit()
    conn.close()