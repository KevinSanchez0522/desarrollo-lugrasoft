from django.urls import path
from .views import reportes, reporteVentas, reporteVentasDinamicas, costeoInventario, filtrarXfecha, editarRemision, edicionRemision, anularRemision, detallesremi



urlpatterns = [
    path('', reportes, name= 'reportes' ),
    path('reporteVentas/', reporteVentas , name= 'reporteVentas'),
    path('reporteVentasDinamicas/', reporteVentasDinamicas , name= 'reporteVentasDinamicas'),
    path('costoInventario/', costeoInventario, name= 'costearInventario'),
    path('filtrarFacturaFecha/', filtrarXfecha , name= 'buscarXfecha'),
    path('editar-remision/<int:nremision>/', editarRemision, name= 'editarRemision'),
    path('edicion/', edicionRemision, name= 'edicionRemision'),
    path('anular-remision/<int:nremision>/', anularRemision, name= 'anularRemision'),
    path('detalles-remision/', detallesremi, name= 'datosRemision'),  
]