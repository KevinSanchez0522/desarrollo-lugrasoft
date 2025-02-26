from django.urls import path
from .views import facturar, obtenerOrdenCliente, productos_facturar,PFacturar, obtener_numero_factura, precio_producto, VerFacturas, detallesFactura,descargar_pdf, editarFacturas,buscarXfecha, editarFactura,anularFactura, retornoItemProduccion,listaPrecios,actualizarLista,consultarPrecios


urlpatterns = [
    path('', facturar, name= 'facturacion' ),
    path('obtenerOrden/', obtenerOrdenCliente, name='obtenerOrdenCliente'),
    path('productosAFacturar/', productos_facturar , name= 'datosFacturacion'),
    path('facturar/', PFacturar , name= 'facturacion1'),
    path('obtenerF/', obtener_numero_factura, name= 'obtenerFactura'),
    path('precioProducto/', precio_producto, name='precioxproducto'),
    path('verfactura/', VerFacturas , name= 'verfactura' ),
    path('detalles_factura/', detallesFactura, name='detallesFacturacion'),
    path('descargar_pdf/<str:factura_numero>/', descargar_pdf, name='descargar_pdf'),
    path('editarFactura/<int:nfactura>/', editarFacturas, name= 'editar'),
    path('edicion/', editarFactura , name= 'Edicion'),
    path('anular/<int:nfactura>/', anularFactura, name= 'anular'),
    path('buscarFacturaFecha/', buscarXfecha , name='buscarFechas'),
    path('devolver-produccion/', retornoItemProduccion, name='devolverItem'),
    path('lista_precios/', listaPrecios, name='ListaPrecios'),
    path('ActualizarLista/', actualizarLista, name='actualizar_precios'),
    path('ObtenerListaPrecios/', consultarPrecios, name='obtenerListaPrecios')
]