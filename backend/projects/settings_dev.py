from .settings import *

DEBUG = True

ALLOWED_HOSTS = ["*"]

# Use the production MySQL database configuration from settings.py.
CORS_ALLOW_ALL_ORIGINS = True

# Disable throttling for development
REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"] = {
    "anon": "10000/day",
    "user": "100000/day",
}
