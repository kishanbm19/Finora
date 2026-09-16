from datetime import date, datetime, timezone


def today() -> date:
    return datetime.now(timezone.utc).date()


def month_bounds(year: int, month: int) -> tuple[date, date]:
    start = date(year, month, 1)
    if month == 12:
        end = date(year + 1, 1, 1)
    else:
        end = date(year, month + 1, 1)
    from datetime import timedelta

    return start, end - timedelta(days=1)


def previous_month(year: int, month: int) -> tuple[int, int]:
    if month == 1:
        return year - 1, 12
    return year, month - 1
