from django.urls import path
from .views import reportes, reporteVentas



urlpatterns = [
    path('', reportes, name= 'reportes' ),
    path('reporteVentas/', reporteVentas , name= 'reporteVentas')
]