"""
WSGI config for lugrascolv2 project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/howto/deployment/wsgi/
"""

import os
from decouple import config
from django.core.wsgi import get_wsgi_application

#settings_module = 'lugrascolv2.deployment' if 'WEBSITE_HOSTNAME' in os.environ else  'lugrascolv2.settings'

os.environ.setdefault('DJANGO_SETTINGS_MODULE',  'lugrascolv2.settings')

application = get_wsgi_application()
