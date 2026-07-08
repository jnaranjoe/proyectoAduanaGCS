from datetime import date
from services.date_service import calculate_end_date

def test_calculate_end_date_matutino_no_holidays():
    # 30 hours, matutino (6h/day) -> 5 days
    # Monday 2026-07-06 to Friday 2026-07-10
    start = date(2026, 7, 6)
    end = calculate_end_date(start, 30, "matutino")
    assert end == date(2026, 7, 10)

def test_calculate_end_date_vespertino_weekend():
    # 30 hours, vespertino (5h/day) -> 6 days
    # Monday 2026-07-06 + 6 days skipping weekend -> 2026-07-13
    start = date(2026, 7, 6)
    end = calculate_end_date(start, 30, "vespertino")
    assert end == date(2026, 7, 13)

def test_calculate_end_date_guayaquil_holiday():
    # 12 hours, matutino (6h/day) -> 2 days
    # Start: July 24 (Friday) -> July 24 is day 1
    # July 25 is Saturday AND Holiday (Fundación) -> skipped
    # July 26 is Sunday -> skipped
    # July 27 is Monday -> day 2
    start = date(2026, 7, 24)
    end = calculate_end_date(start, 12, "matutino")
    assert end == date(2026, 7, 27)

def test_calculate_end_date_national_holiday():
    # Independence of Cuenca (Nov 3)
    # Start: Nov 2, 2026 (Monday). Needs 2 days (matutino)
    # Nov 2 is holiday (Dia de difuntos) -> skipped
    # Nov 3 is holiday (Independencia Cuenca) -> skipped
    # Nov 4 (Wed) -> day 1
    # Nov 5 (Thu) -> day 2
    start = date(2026, 11, 2)
    end = calculate_end_date(start, 12, "matutino")
    assert end == date(2026, 11, 5)
