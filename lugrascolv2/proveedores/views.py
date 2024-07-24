from django.http import JsonResponse
from django.shortcuts import render
from  facturacion.models import Proveedores, TransMp, Inventario, Compras

# Create your views here.
def verProveedor(request):
    proveedor = Proveedores.objects.all()

    return render(request, 'proveedores.html',{'proveedores': proveedor})



def obtener_productos_por_proveedor(request, proveedor_id):
    # Filtrar productos por proveedor
    if proveedor_id:
            # Filtrar productos por ID del proveedor
        productos = Inventario.objects.filter(id_proveedor=proveedor_id)
        producto = TransMp.objects.filter(id_proveedor=proveedor_id)
        # Obtener el último precio unitario del producto seleccionado desde TransMp
        ultimo_transaccion = TransMp.objects.filter(id_proveedor=proveedor_id).order_by('-fecha_ingreso').first()
        if ultimo_transaccion:
            precio_unitario = ultimo_transaccion.costo_unitario
        else:
            # Si no hay transacciones, establecer un precio predeterminado
            precio_unitario = 0
        
        # Construir lista de datos para los productos encontrados
        data = []
        for producto_inv in productos:
            # Obtener el costo unitario del producto del modelo TransMp

            
            # Crear un diccionario con los datos del producto
            producto_data = {
                'id': producto_inv.cod_inventario,
                'nombre': producto_inv.nombre,
                'proveedor_id': producto_inv.id_proveedor.id_proveedor,
                'costo_unitario': precio_unitario
            }
            data.append(producto_data)
        
        return JsonResponse(data, safe=False)
    else:
        return JsonResponse({'error': 'No se proporcionó un ID de proveedor válido'}, status=400)