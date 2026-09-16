import re

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def is_valid_email(value: str) -> bool:
    return bool(EMAIL_REGEX.match(value))


def is_positive_amount(value: float) -> bool:
    return value > 0


def is_non_empty_string(value: str | None) -> bool:
    return bool(value and value.strip())
