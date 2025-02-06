from django.urls import path
from django.contrib import admin
from .views import InicioSesion, Validar_Credenciales, Dashboard, exit, listarOrden, promediarVentas, ventasPorDia, PorAgotarse

urlpatterns = [
    path('', InicioSesion, name= 'inicio'),
    path('validado/', Validar_Credenciales, name= 'validar'),
    path('dash/', Dashboard, name='dashboard' ),
    path('exit', exit , name= 'exit'),
    path('conteo-ordenes/', listarOrden , name= 'ordenesTotales'),
    path('promedio-ventas/', promediarVentas , name= 'promedioVentasTotales'),
    path('ventas-por-dia/', ventasPorDia, name= 'ventasDiarias'),
    path('productos_por_agotarse/', PorAgotarse, name='PorAgotar')
]