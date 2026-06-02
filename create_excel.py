import pandas as pd

def create_sample_excel():
    data = {
        "Class": [10, 10, 10, 10, 10, 10, 10],
        "Section": ["A", "A", "A", "A", "A", "A", "A"],
        "Subject": ["Maths", "Science", "Social Science", "First Language", "Second Language", "Third Language", "Physical Education"],
        "Teacher_ID": [101, 102, 103, 104, 105, 106, 107],
        "Periods_Per_Week": [6, 6, 6, 6, 6, 6, 4] # Total exactly 40
    }
    
    df = pd.DataFrame(data)
    df.to_excel("school_data.xlsx", index=False)
    print("Successfully created 'school_data.xlsx'!")

if __name__ == "__main__":
    create_sample_excel()