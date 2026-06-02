from database import save_schedule_entry

def generate_timetable(requirements):
    print("Starting smart scheduling algorithm...")
    
    occupied = {}
    daily_subject_count = {} # Tracks how many times a subject is taught in a single day
    
    success_count = 0

    for req in requirements:
        grade = req['Class']
        section = req['Section']
        subject = req['Subject']
        teacher_id = req['Teacher_ID']
        periods_needed = req['Periods_Per_Week']
        
        cohort_name = f"cohort_{grade}_{section}"
        assigned = 0
        
        # Keep looping until all periods for this subject are assigned
        while assigned < periods_needed:
            
            # Spread classes across Monday(1) to Friday(5)
            for day in range(1, 6): 
                if assigned >= periods_needed:
                    break
                    
                # Constraint: Max 2 periods of the same subject per day
                daily_limit_key = (cohort_name, day, subject)
                if daily_subject_count.get(daily_limit_key, 0) >= 2:
                    continue # Skip this day and try tomorrow
                
                # Find the first available period on this day
                for period in range(1, 9): 
                    teacher_key = (f"teacher_{teacher_id}", day, period)
                    cohort_key = (cohort_name, day, period)
                    
                    if teacher_key not in occupied and cohort_key not in occupied:
                        # Mark as occupied
                        occupied[teacher_key] = True
                        occupied[cohort_key] = True
                        
                        # Increment our daily limit tracker
                        daily_subject_count[daily_limit_key] = daily_subject_count.get(daily_limit_key, 0) + 1
                        
                        # Save to MySQL
                        save_schedule_entry(grade, section, subject, teacher_id, day, period)
                        assigned += 1
                        success_count += 1
                        
                        # BREAK out of the period loop! 
                        # This forces the algorithm to move to the NEXT DAY before 
                        # assigning this subject again, spreading it evenly across the week.
                        break 
                        
    print(f"Successfully generated and saved {success_count} timetable entries to MySQL!")