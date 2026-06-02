import pandas as pd

def load_and_validate(file_path):
    print(f"Reading {file_path}...")
    try:
        df = pd.read_excel(file_path)
    except FileNotFoundError:
        print("Error: Excel file not found. Run create_excel.py first.")
        return None
        
    # Check if every cohort has exactly 40 periods
    cohort_totals = df.groupby(['Class', 'Section'])['Periods_Per_Week'].sum()
    
    for (grade, section), total in cohort_totals.items():
        if total != 40:
            print(f"Validation Failed: Class {grade}{section} has {total} periods instead of 40.")
            return None
            
    print("Validation Passed: All cohorts have exactly 40 periods.")
    
    # Convert the pandas dataframe into a standard Python list of dictionaries
    return df.to_dict(orient='records')