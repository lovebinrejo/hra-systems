"""
Local development settings.
"""
from .base import *  # noqa

DEBUG = True

INSTALLED_APPS += ['debug_toolbar']  # noqa

MIDDLEWARE = ['debug_toolbar.middleware.DebugToolbarMiddleware'] + MIDDLEWARE  # noqa

INTERNAL_IPS = ['127.0.0.1']

# Use console backend — no real emails sent
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# CORS: Allow React dev server
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
]
CORS_ALLOW_CREDENTIALS = True

# Simpler logging for local dev
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {'class': 'logging.StreamHandler'},
    },
    'root': {
        'handlers': ['console'],
        'level': 'DEBUG',
    },
    'loggers': {
        'django.db.backends': {
            'handlers': ['console'],
            'level': 'WARNING',  # Set to DEBUG to see all SQL queries
        },
    },
}
