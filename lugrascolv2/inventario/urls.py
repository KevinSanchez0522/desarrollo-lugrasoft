from django.urls import path
from .views import inventory_view, ajuste, obtener_numero_ajuste,agregar_transaccion_ajuste, agregar_transaccion_averias,obtener_numero_averia,averias, generar_informe_averia, buscarKardex, kardex_view, cargaSaldos, upload_excel,guardarDatos,verAverias,buscarAverias,imprimirInventario,CargarDatos,ProcesarInventario,EditarNombreInven, GenerarAjusteInv
urlpatterns = [
    path('', inventory_view, name= 'inv'),
    path('ajuste/', ajuste , name= 'ajuste'),
    path('obtener/', obtener_numero_ajuste, name= 'obtenerA'),
    path('agregar/', agregar_transaccion_ajuste, name= 'agregar_transaccion'),
    path('averias/', averias, name= 'averias'),
    path('obtener_averiaN/', obtener_numero_averia, name= 'obtenerAveria'),
    path('agregarAveria/', agregar_transaccion_averias, name='agregarAverias'),
    path('informe/', generar_informe_averia, name= 'informe'),
    path('kardex/', buscarKardex, name= 'kardex'), 
    path('api/kardex/', kardex_view, name='kardex_view'),
    path('carga-saldos-iniciales/', cargaSaldos, name= 'cargaSaldosIniciales'),
    path('upload_excel/', upload_excel, name='upload_excel'),
    path('guardar-datos', guardarDatos , name='procesarDatos'),
    path('verAverias/', verAverias, name='verAverias'),
    path('averiasXfecha/', buscarAverias, name='buscarAveria'),
    path('exportar-inventario/', imprimirInventario, name='exportar'),
    path('cargarInventario/', CargarDatos, name='cargarInventario'),
    path('CargarArchivo/', ProcesarInventario, name='cargarArchivoInventario'),
    path('EditarNombre/', EditarNombreInven , name='EditarNombre'),
    path('GenerarAjuste/', GenerarAjusteInv, name='GenerarAjusteInventario')
]