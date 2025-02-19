from django.urls import path
from django.contrib import admin
from .views import InicioSesion, Validar_Credenciales, Dashboard, exit, listarOrden, promediarVentas, ventasPorDia, PorAgotarse,AlertarProductos, ListaProductosAlertas, Lista_Productos_Alertas,EliminarItem, ReportarCasoSoporte,GuardarCaso,CasosReportados, CambiarEstado

urlpatterns = [
    path('', InicioSesion, name= 'inicio'),
    path('validado/', Validar_Credenciales, name= 'validar'),
    path('dash/', Dashboard, name='dashboard' ),
    path('exit', exit , name= 'exit'),
    path('conteo-ordenes/', listarOrden , name= 'ordenesTotales'),
    path('promedio-ventas/', promediarVentas , name= 'promedioVentasTotales'),
    path('ventas-por-dia/', ventasPorDia, name= 'ventasDiarias'),
    path('productos_por_agotarse/', PorAgotarse, name='PorAgotar'),
    path('alertaProductos/', AlertarProductos, name='ProductosXAlerta'),
    path('lista_producto_alertas/', ListaProductosAlertas , name='listaProductoAlertas'),
    path('lista-Productos-aletados/', Lista_Productos_Alertas, name='listadoAlertas'),
    path('eliminarItem/<int:cod_inventario>/', EliminarItem , name= 'eliminarItemAlerta'),
    path('reportarCasoSoporte/', ReportarCasoSoporte, name='reportarCaso'),
    path('casoReportado/', GuardarCaso, name='reporteCaso'),
    path('ListadoCasos/', CasosReportados, name='ListaCasos'),
    path('cambiarEstado/', CambiarEstado, name='CambiarEstadoCaso')
]