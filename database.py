import mysql.connector

DB_CONFIG = {
    "unix_socket": "/var/lib/mysql/mysql.sock",
    "user": "root",
    "password": "password123",
    "database": "timetable_db"
}

def get_connection():
    return mysql.connector.connect(**DB_CONFIG)

def setup_database():
    init_config = DB_CONFIG.copy()
    del init_config["database"]
    conn = mysql.connector.connect(**init_config)
    cursor = conn.cursor()
    cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_CONFIG['database']}")
    cursor.execute(f"USE {DB_CONFIG['database']}")
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
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("TRUNCATE TABLE schedule_entries")
    conn.commit()
    cursor.close()
    conn.close()

# ✅ NEW: bulk insert — one connection, one query
def save_all_entries(entries):
    """
    entries: list of (class_grade, section, subject, teacher_id, day, period)
    """
    if not entries:
        return
    conn = get_connection()
    cursor = conn.cursor()
    query = """
    INSERT INTO schedule_entries 
    (class_grade, section, subject, teacher_id, day_of_week, period_number) 
    VALUES (%s, %s, %s, %s, %s, %s)
    """
    cursor.executemany(query, entries)  # single round-trip for all rows
    conn.commit()
    cursor.close()
    conn.close()