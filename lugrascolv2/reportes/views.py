from django.http import JsonResponse
from django.shortcuts import get_object_or_404, render
from facturacion.models import Facturas, Clientes

# Create your views here.
def reportes(request):
    return render(request, 'reportes.html')


def reporteVentas(request):
# Obtener todas las facturas
    facturas = Facturas.objects.all()

    # Convertir y formatear `total_factura` directamente en la vista
    facturas_formateadas = []
    for factura in facturas:
        nombre_cliente = get_object_or_404(Clientes, nit=factura.cliente)
        cliente = nombre_cliente.nombre
        facturaAnulada = factura.total_factura == 0

        factura_formateada = {
            'nfactura': factura.nfactura,
            'fecha_facturacion': factura.fecha_facturacion,
            'total_factura_formateado': f"{factura.total_factura:,}",
            'nombreCliente': cliente,
            'facturaAnulada': facturaAnulada
        }
        
        # Añadir el diccionario a la lista
        facturas_formateadas.append(factura_formateada)
    


    # Devolver los datos en formato JSON
    return JsonResponse({
        'facturas': facturas_formateadas,
        
    })