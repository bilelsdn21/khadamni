# validators.py — Input Validation Helpers
#
# What to build here:
#
# 1. Write validate_phone(phone) → bool
#      - Check if phone matches international format: +XXXXXXXXXXX
#      - Use regex: ^\+?[1-9]\d{7,14}$
# 2. Write validate_password_strength(password) → str or None
#      - Return error message if weak, None if OK
#      - Rules: min 8 chars, at least 1 uppercase, 1 lowercase, 1 digit
#
# Packages to learn:
#   - re (regular expressions)
