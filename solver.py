from database import save_all_entries

def generate_timetable(requirements):
    print("Starting smart scheduling algorithm...")

    occupied = {}
    daily_subject_count = {}
    all_entries = []   # ✅ collect here instead of hitting DB each time

    for req in requirements:
        grade        = req['Class']
        section      = req['Section']
        subject      = req['Subject']
        teacher_id   = req['Teacher_ID']
        periods_needed = req['Periods_Per_Week']

        cohort_name = f"cohort_{grade}_{section}"
        assigned = 0

        while assigned < periods_needed:
            for day in range(1, 6):
                if assigned >= periods_needed:
                    break

                daily_limit_key = (cohort_name, day, subject)
                if daily_subject_count.get(daily_limit_key, 0) >= 2:
                    continue

                for period in range(1, 9):
                    teacher_key = (f"teacher_{teacher_id}", day, period)
                    cohort_key  = (cohort_name, day, period)

                    if teacher_key not in occupied and cohort_key not in occupied:
                        occupied[teacher_key] = True
                        occupied[cohort_key]  = True
                        daily_subject_count[daily_limit_key] = \
                            daily_subject_count.get(daily_limit_key, 0) + 1

                        all_entries.append(
                            (grade, section, subject, teacher_id, day, period)
                        )
                        assigned += 1
                        break

    # ✅ ONE bulk insert for everything — replaces hundreds of individual saves
    save_all_entries(all_entries)
    print(f"Successfully generated and saved {len(all_entries)} entries to MySQL!")