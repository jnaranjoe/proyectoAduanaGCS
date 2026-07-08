import holidays
from datetime import timedelta, date

def get_ecuador_holidays(year: int):
    # Get standard Ecuador holidays
    ec_holidays = holidays.EC(years=year)
    
    # Add local Guayaquil holidays manually since python holidays EC might not include local Guayas subdiv easily in older versions,
    # or just to be safe.
    # July 25 - Fundación de Guayaquil
    # October 9 - Independencia de Guayaquil
    ec_holidays.update({
        date(year, 7, 25): "Fundación de Guayaquil",
        date(year, 10, 9): "Independencia de Guayaquil",
    })
    return ec_holidays

def calculate_end_date(start_date: date, total_hours: int, shift: str) -> date:
    """
    Calculates the end date based on start date, total hours required, and shift.
    shift: "matutino" (6h) or "vespertino" (5h)
    Ignores weekends and Ecuador/Guayaquil holidays.
    """
    hours_per_day = 6 if shift.lower() == "matutino" else 5
    
    # Calculate total required working days (ceiling division for any remaining hours)
    days_required = (total_hours + hours_per_day - 1) // hours_per_day
    
    current_date = start_date
    days_added = 0
    
    ec_holidays = get_ecuador_holidays(current_date.year)
    
    while days_added < days_required:
        # Check if year changed, load new holidays
        if current_date.year not in ec_holidays:
            ec_holidays.update(get_ecuador_holidays(current_date.year))
            
        # Check if weekend (5=Saturday, 6=Sunday) or holiday
        if current_date.weekday() < 5 and current_date not in ec_holidays:
            days_added += 1
            
        if days_added < days_required:
            current_date += timedelta(days=1)
            
    return current_date
