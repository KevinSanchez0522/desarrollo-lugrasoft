import json
from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404, render
from facturacion.models import Facturas, Clientes, Remisiones, Inventario, TransMp, TransaccionOrden, Transformulas, TransaccionRemision
from django.utils.dateparse import parse_date

# Create your views here.
def reportes(request):
    if not (request.user.groups.filter(name="Contabilidad").exists() or request.user.groups.filter(name="Gerencia").exists()):
        return render(request, '403.html', status=403)
    else:
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
    
    
def reporteVentasDinamicas(request):
    # Obtener todas las facturas
    remisiones = Remisiones.objects.all()

    # Convertir y formatear `total_factura` directamente en la vista
    remisiones_formateadas = []
    for remision in remisiones:
        nombre_cliente = get_object_or_404(Clientes, nit=remision.cliente)
        cliente = nombre_cliente.nombre
        remisionAnulada = remision.estado == 'anulado'
        


        remision_formateada = {
            'nremision': remision.nremision,
            'fecha_remision': remision.fecha_remision,
            'total_remision_formateado': f"{remision.total_remision:,}",
            'nombreCliente': cliente,
            'remisionAnulada': remisionAnulada
        }
        
        # Añadir el diccionario a la lista
        remisiones_formateadas.append(remision_formateada)



    # Devolver los datos en formato JSON
    return JsonResponse({
        'remisiones': remisiones_formateadas,
        
    })
    
    
    


def costeoInventario(request):
    try:
        productos = Inventario.objects.filter(cantidad__gt=0)
        
        productos_formateados = []

        for producto in productos:
            # Verificar si el código del producto está en las fórmulas
            formula = Transformulas.objects.filter(
                cod_inventario=producto.cod_inventario
            ).first()
            
            if formula:
                # Si el código del producto es una fórmula, calcular el costo usando la fórmula
                subtotal_costo = 0.0
                iva_costo = 0.0
                total_costo = 0.0
                
                # Calcular el subtotal_costo usando las materias primas de la fórmula
                for i in range(1, 11):  # Iterar sobre los campos materia1 hasta materia8
                    campo_materia = getattr(formula, f"materia{i}")
                    if campo_materia:  # Verificar si hay un código de materia prima en el campo actual
                        materia_prima = TransMp.objects.filter(cod_inventario=campo_materia).order_by('-fecha_ingreso').first()
                        if materia_prima:
                            setattr(formula, f"costo_unitario{i}", materia_prima.costo_unitario)
                            cantidad = getattr(formula, f"cant_materia{i}")
                            costo_unitario = getattr(materia_prima, f"costo_unitario")
                            subtotal_costo += cantidad * costo_unitario
                        else:
                            # Asignar valores predeterminados si la materia prima no se encuentra
                            setattr(formula, f"nombre_mp{i}", "Materia prima no encontrada")
                            setattr(formula, f"costo_unitario{i}", 0.0)
                
                iva_costo = (subtotal_costo * formula.porcentajeiva) / 100
                total_costo = subtotal_costo + formula.costosindirectos + iva_costo
                
                precio_unitario = total_costo
            
            else:
                # Si el código del producto es una materia prima, obtener el costo unitario de la última transacción
                ultimo_transaccion = TransMp.objects.filter(
                    cod_inventario=producto.cod_inventario
                ).order_by('-fecha_ingreso').first()
                
                if ultimo_transaccion:
                    # Si existe una transacción, usa su costo unitario
                    precio_unitario = ultimo_transaccion.costo_unitario
                else:
                    # Si no hay transacción, establecer un precio predeterminado
                    precio_unitario = 0

            producto_formateado = {
                'codigo': producto.cod_inventario,
                'nombre': producto.nombre,
                'cantidad': producto.cantidad,
                'precio': f"{precio_unitario:,}",
            }
            productos_formateados.append(producto_formateado)
        
        return JsonResponse({'productos': productos_formateados})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    
    

def filtrarXfecha(request):
    
    fecha_inicio_str = request.GET.get('fecha_inicio')
    fecha_fin_str = request.GET.get('fecha_fin')

    # Convertir las fechas de cadena a objetos de fecha
    fecha_inicio = parse_date(fecha_inicio_str) if fecha_inicio_str else None
    fecha_fin = parse_date(fecha_fin_str) if fecha_fin_str else None

    # Filtrar facturas por rango de fechas
    facturas_query = Facturas.objects.all()
    if fecha_inicio and fecha_fin:
        facturas_query = facturas_query.filter(fecha_facturacion__range=(fecha_inicio, fecha_fin))

    # Convertir y formatear las facturas filtradas
    facturas_formateadas = []
    for factura in facturas_query:
        id_orden = factura.id_orden_field
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
        
        facturas_formateadas.append(factura_formateada)

    return JsonResponse({'facturas': facturas_formateadas})

def filtrarXfechaRemision(request):
    
    fecha_inicio_str = request.GET.get('fecha_inicio')
    fecha_fin_str = request.GET.get('fecha_fin')

    # Convertir las fechas de cadena a objetos de fecha
    fecha_inicio = parse_date(fecha_inicio_str) if fecha_inicio_str else None
    fecha_fin = parse_date(fecha_fin_str) if fecha_fin_str else None

    # Filtrar facturas por rango de fechas
    facturas_query = Remisiones.objects.all()
    if fecha_inicio and fecha_fin:
        facturas_query = facturas_query.filter(fecha_remision__range=(fecha_inicio, fecha_fin))

    # Convertir y formatear las facturas filtradas
    remisiones_formateadas = []
    for remision in facturas_query:
        id_orden = remision.id_orden
        nombre_cliente = get_object_or_404(Clientes, nit=remision.cliente)
        cliente = nombre_cliente.nombre
        facturaAnulada = remision.total_remision == 0

        factura_formateada = {
            'nfactura': remision.nremision,
            'fecha_facturacion': remision.fecha_remision,
            'total_factura_formateado': f"{remision.total_remision:,}",
            'nombreCliente': cliente,
            'facturaAnulada': facturaAnulada
        }
        
        remisiones_formateadas.append(factura_formateada)

    return JsonResponse({'remisiones': remisiones_formateadas})

def filtrarXfechaCombinadas(request):
    
    fecha_inicio_str = request.GET.get('fecha_inicio')
    fecha_fin_str = request.GET.get('fecha_fin')

    # Convertir las fechas de cadena a objetos de fecha
    fecha_inicio = parse_date(fecha_inicio_str) if fecha_inicio_str else None
    fecha_fin = parse_date(fecha_fin_str) if fecha_fin_str else None

    # Filtrar facturas por rango de fechas
    facturas_query = Facturas.objects.all()
    remisiones_query = Remisiones.objects.all()
    if fecha_inicio and fecha_fin:
        facturas_query = facturas_query.filter(fecha_facturacion__range=(fecha_inicio, fecha_fin))
        remisiones_query = remisiones_query.filter(fecha_remision__range=(fecha_inicio, fecha_fin))

    # Convertir y formatear las facturas filtradas
    facturas_formateadas = []
    for factura in facturas_query:
        id_orden = factura.id_orden_field
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
        
        facturas_formateadas.append(factura_formateada)
        
    for remision in remisiones_query:
        id_orden = remision.id_orden
        nombre_cliente = get_object_or_404(Clientes, nit=remision.cliente)
        cliente = nombre_cliente.nombre
        facturaAnulada = remision.total_remision == 0
        
        remision_formateada = {
            'nfactura': remision.nremision,
            'fecha_facturacion': remision.fecha_remision,
            'total_factura_formateado': f"{remision.total_remision:,}",
            'nombreCliente': cliente,
            'facturaAnulada': facturaAnulada
        }
        facturas_formateadas.append(remision_formateada)

    return JsonResponse({'combinadas': facturas_formateadas})

def editarRemision(request, nremision):
    transacciones = TransaccionRemision.objects.filter(nremision=nremision)
    
    datos = get_object_or_404(Remisiones, nremision=nremision)
    
    primeraTransaccion = transacciones.first()
    fecha_factura = primeraTransaccion.fecha_remision
    numero_factura = primeraTransaccion.nremision
    orden = datos.id_orden

    id_cliente = datos.cliente
    cliente = get_object_or_404(Clientes, nit=id_cliente)
    

    
    
    # Crea una lista de diccionarios con los datos de cada transacción
    datos_transacciones = []
    for transaccion in transacciones:
        try:
            # Busca el nombre del producto en el modelo Inventario
            producto = Inventario.objects.get(cod_inventario=transaccion.cod_inventario)
            nombre_producto = producto.nombre
        except Inventario.DoesNotExist:
            nombre_producto = "Desconocido"  # Maneja el caso en que el producto no se encuentre

        datos_transacciones.append({
            'producto': transaccion.cod_inventario,
            'nombre_producto': nombre_producto,
            'cantidad': transaccion.cantidad,
            'precio': f"${transaccion.precio_venta:,}",
        })
    
    # Pasa los datos al contexto
    context = {
        'transacciones': datos_transacciones,
        'fecha': fecha_factura,
        'factura': numero_factura,
        'orden': orden,
        'nit': cliente.nit,
        'nombre': cliente.nombre,
        'direccion': cliente.direccion,
        'telefono': cliente.telefono,
        'correo': cliente.email
        
        
        
    }
    
    return render(request, 'editarRemision.html', context)

    
    
    
def edicionRemision(request):
    # Obtiene los datos de la remisión a editar
    if request.method == 'POST':
        try:
            # Leer los datos JSON del cuerpo de la solicitud
            data = json.loads(request.body)
            factura = data.get('factura')
            totalFactura = data.get('totalFactura')
            productos = data.get('filas')
            
            
            # Filtrar las transacciones por número de factura
            transacciones = TransaccionRemision.objects.filter(nremision=factura)
            
            
            
            facturas = get_object_or_404(Remisiones, nremision=factura)
            facturas.total_remision = convertir_a_numero(totalFactura)
            facturas.save()
            
    

            # Crear un diccionario para mapear códigos de productos a precios
            productos_dict = {str(producto['producto']): float(producto['precio']) for producto in productos}
            
            print('diccionario', productos_dict)
            
            # Variable para almacenar IDs de productos que no se encontraron
            productos_no_encontrados = []

            # Actualizar precios en las transacciones
            for transaccion in transacciones:
                
                cod_producto = str(transaccion.cod_inventario).strip()
                print('codigo',cod_producto, transaccion.cod_inventario)
                if cod_producto in productos_dict:
                    print('ingrese por if')
                    nuevo_precio = productos_dict[cod_producto]
                    print('Nuevo precio para el código', cod_producto, ':', nuevo_precio)
                    transaccion.precio_venta = nuevo_precio
                    transaccion.save()
                else:
                    # Si el código de producto no se encuentra en los datos enviados
                    productos_no_encontrados.append(cod_producto)
            
            # Responder con un JSON
            response_data = {
                'success': True,
                'factura': factura,
                'productos_no_encontrados': productos_no_encontrados
            }
            return JsonResponse(response_data)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
    else:
        return JsonResponse({'error': 'Invalid request method'}, status=405)
    
    
    
    
    
def anularRemision(request, nremision):
    if request.method == 'POST':
        
        estado = 'por facturar'
        # Filtrar las transacciones asociadas a la factura
        transacciones = TransaccionRemision.objects.filter(nremision=nremision)
        factura = get_object_or_404(Remisiones, nremision=nremision)
        factura.total_remision = 0
        factura.estado = 'anulado'
        factura.save()
        
        
        updateEstado = TransaccionOrden.objects.filter(id_orden=factura.id_orden)
        updateEstado.update(estado=estado)
        if not transacciones.exists():
            return JsonResponse({'error': 'No se encontraron transacciones para esta factura'}, status=404)
        
        # Listar los cod_inventario y cantidades
        inventarios_actualizados = []

        for transaccion in transacciones:
            cod_inventario = transaccion.cod_inventario
            cantidad = transaccion.cantidad

            # Cambiar la cantidad en TransaccionFactura a negativa
            transaccion.cantidad = -cantidad
            transaccion.precio_venta = 0
            transaccion.save()

            # Buscar el inventario asociado
            inventario = Inventario.objects.filter(cod_inventario=cod_inventario).first()

            if inventario:
                # Restar la cantidad del inventario
                inventario.cantidad += cantidad
                inventario.save()
                inventarios_actualizados.append({
                    'cod_inventario': cod_inventario,
                    'nueva_cantidad': inventario.cantidad
                })
            else:
                return JsonResponse({'error': f'No se encontró inventario para el código {cod_inventario}'}, status=404)

        # Responder con éxito
        return JsonResponse({
            'success': True,
            'inventarios_actualizados': inventarios_actualizados
        })

    # Manejo para métodos HTTP diferentes a POST
    return HttpResponse("Método no permitido", status=405)    





def detallesremi(request):
    remision_id = request.GET.get('remisionId')
    print('N factura', remision_id)
    
    if remision_id:
        try:
            
            
            transacciones = TransaccionRemision.objects.filter(nremision=remision_id)
            remision = get_object_or_404(Remisiones, nremision= remision_id)
            cliente = get_object_or_404(Clientes, nit=remision.cliente)
            

            subtotal = remision.total_remision
            
            
            productos = []
            for transaccion in transacciones:
                # Obtener detalles del producto desde el modelo Inventario
                producto = Inventario.objects.get(cod_inventario=transaccion.cod_inventario)
                if Transformulas.objects.filter(cod_inventario=producto.cod_inventario).exists():
                    producto_transformula = Transformulas.objects.get(cod_inventario=producto.cod_inventario)
                    peso = producto_transformula.peso
                else:
                    peso = 0
                # Agregar los detalles del producto a la lista
                productos.append({
                    'cod_inventario': producto.cod_inventario,
                    'nombre': producto.nombre,
                    'cantidad': '{:.0f}'.format(transaccion.cantidad) if transaccion.cantidad == int(transaccion.cantidad) or round(transaccion.cantidad, 2) == int(transaccion.cantidad) else f"{transaccion.cantidad:.2f}",
                    'fecha_factura': transaccion.fecha_remision,
                    'precio_unitario': f"{transaccion.precio_venta:,}",
                    'total_factura': f"{remision.total_remision:,}",
                    'nit_cliente': cliente.nit,
                    'nombre_cliente': cliente.nombre,
                    'telefono_cliente': cliente.telefono,
                    'direccion_cliente': cliente.direccion,
                    'correo_cliente': cliente.email,
                    'subtotal': f"{subtotal:,}",
                    'peso':peso
                })
            
            # Preparar los datos para enviar en la respuesta JSON
            data = {
                'productos': productos,
            }
            
            return JsonResponse(data)
        except Facturas.DoesNotExist:
            return JsonResponse({'error': 'Factura no encontrada'}, status=404)
    else:
        return JsonResponse({'error': 'ID de factura no proporcionado'}, status=400)
    
def convertir_a_numero(cadena):
    # Reemplazar el punto (.) con nada (eliminar separadores de miles)
    cadena = cadena.replace('.', '')
    # Reemplazar la coma (,) con un punto (.) para el separador decimal
    cadena = cadena.replace(',', '.')
    # Convertir la cadena a un número flotante
    numero = float(cadena)
    return numero    