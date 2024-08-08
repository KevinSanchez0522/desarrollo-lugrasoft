import json
from django.http import JsonResponse
from django.shortcuts import render
from .models import Clientes, TransaccionFactura, TransaccionRemision, Facturas, Remisiones , Inventario, OrdenProduccion, TransaccionOrden, Transformulas, TransMp
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Max, F

# Create your views here.
def facturar(request):
    clientes = Clientes.objects.all()
    productos = Inventario.objects.all()
    
    
    
    return render(request, 'facturacion.html',{'clientes': clientes , 'productos': productos,})

def VerFacturas(request):
    # Obtener todas las facturas
    facturas = Facturas.objects.all()
    

    # Convertir y formatear `total_factura` directamente en la vista
    facturas_formateadas = []
    for factura in facturas:
        id_orden = factura.id_orden_field
        
        # Obtener la instancia de OrdenProduccion usando id_orden
        try:
            orden_produccion = OrdenProduccion.objects.get(id_orden=id_orden)
        except OrdenProduccion.DoesNotExist:
            # Manejar el caso cuando no se encuentra la OrdenProduccion
            orden_produccion = None
        
        if orden_produccion:
            # Obtener la instancia de Cliente desde OrdenProduccion
            cliente = orden_produccion.nit  # `nit` es el campo de clave foránea en OrdenProduccion
            
            # Obtener el NIT del cliente
            nombre = cliente.nombre
        
        else:
            # Si no se encuentra la OrdenProduccion, asignar valores predeterminados
            id_cliente = 'Desconocido'

        #total_factura = factura.total_factura / 100.0
        # Convertir `total_factura` a cadena con separadores de miles
        #total_factura_formateado = '{:,.2f}'.format(total_factura).replace(',', 'X').replace('.', ',').replace('X', '.')
        
        # Crear un diccionario con los datos de la factura y el total formateado
        factura_formateada = {
            'nfactura': factura.nfactura,
            'fecha_facturacion': factura.fecha_facturacion,
            'total_factura_formateado': f"{factura.total_factura:,}",
            'nombreCliente': nombre
        }
        
        # Añadir el diccionario a la lista
        facturas_formateadas.append(factura_formateada)
    
    # Pasar las facturas formateadas al contexto de la plantilla
    return render(request, 'verFacturas.html', {'facturas': facturas_formateadas})



def obtenerOrdenCliente(request):
    if request.method == 'GET':
        nit_cliente = request.GET.get('nit_cliente')
        
        # Obtener las órdenes de producción asociadas al cliente por su nit
        ordenes_cliente = OrdenProduccion.objects.filter(nit=nit_cliente).values_list('id_orden', flat=True)
        
        # Filtrar las transacciones de orden que corresponden a las órdenes encontradas
        transacciones = TransaccionOrden.objects.filter(id_orden__in=ordenes_cliente, estado = 'por facturar')
        if transacciones.exists():
            resultados =[]
            # Devolver los datos de la transacción en formato JSON
            for transaccion in transacciones:
                resultados.append({
                    'id_orden': transaccion.id_orden.id_orden,
                    'estado': transaccion.estado,
                })
                # Devolver los datos de las transacciones encontradas en formato JSON
            return JsonResponse({'transacciones': resultados})
        else:
            return JsonResponse({'error': 'No se encontraron transacciones pendientes de facturación para este cliente.'}, status=404)
    else:
        return JsonResponse({'error': 'Método no permitido'}, status=405)
    
    

def productos_facturar(request):
    if request.method == 'GET':
        id_orden = request.GET.get('id_orden')
        
        # Obtener los códigos de inventario desde TransaccionOrden para la id_orden dada
        transacciones = TransaccionOrden.objects.filter(id_orden=id_orden)
        
        # Lista para almacenar los datos de cada fórmula
        datos = []
        
        # Iterar sobre cada transacción encontrada
        for transaccion in transacciones:
            cod_inventario = transaccion.cod_inventario
            cantidad_transaccion = transaccion.cantidad
            
            
            # Obtener la fórmula correspondiente al cod_inventario
            try:
                formula = Transformulas.objects.get(cod_inventario=cod_inventario)
            except Transformulas.DoesNotExist:
                # Manejar el caso donde no se encontró la fórmula
                continue  # O retornar un JsonResponse con un mensaje de error
            
            # Calcular los valores para la fórmula
            subtotal_costo = 0.0
            total_costo = 0.0
            subtotal_venta = 0.0
            total_venta = 0.0
            iva_costo = 0.0
            utilidad_bruta = 0.0
            
            for i in range(1, 9):  # Iterar sobre los campos materia1 hasta materia8
                campo_materia = getattr(formula, f"materia{i}")
                if campo_materia:  # Verificar si hay un código de materia prima en el campo actual
                    # Consultar la materia prima por su código
                    materia_prima = TransMp.objects.filter(cod_inventario=campo_materia).order_by('-fecha_ingreso').first()
                    if materia_prima:
                        # Asignar el nombre y el costo unitario de la materia prima a la fórmula
                        setattr(formula, f"nombre_mp{i}", materia_prima.nombre_mp)
                        setattr(formula, f"costo_unitario{i}", materia_prima.costo_unitario)
                        cantidad = getattr(formula, f"cant_materia{i}")
                        costo_unitario = getattr(materia_prima, f"costo_unitario")
                        subtotal_costo += cantidad * costo_unitario
                    else:
                        # Asignar valores predeterminados si la materia prima no se encuentra
                        setattr(formula, f"nombre_mp{i}", "Materia prima no encontrada")
                        setattr(formula, f"costo_unitario{i}", 0.0)
            
            # Calcular otros valores necesarios para la fórmula
            iva_costo = (subtotal_costo * formula.porcentajeiva) / 100            
            total_costo = subtotal_costo + formula.costosindirectos + iva_costo
            utilidad_bruta = ((subtotal_costo + formula.costosindirectos) * formula.pocentajeutilidad) / 100
            subtotal_venta = subtotal_costo + formula.costosindirectos + utilidad_bruta
            total_venta = subtotal_venta + (subtotal_venta * formula.porcentajeiva) / 100
            
            # Redondear los valores a dos decimales
            subtotal_costo = round(subtotal_costo, 2)
            total_costo = round(total_costo, 2)
            subtotal_venta = round(subtotal_venta, 2)
            total_venta = round(total_venta, 2)
            iva_costo = round(iva_costo, 2)
            utilidad_bruta = round(utilidad_bruta, 2)
            print('cantidad producto: ', cantidad_transaccion)
            
            # Crear un diccionario con los datos de la fórmula actual
            formula_data = {
                'id_producto': formula.cod_inventario.cod_inventario,
                'nombre': formula.nombre,
                'cantidad': cantidad_transaccion,# Ajustar según tus modelos
                'iva': formula.porcentajeiva,
                #'costo_unitario': formula.costo_unitario,
                'subtotal_costo': subtotal_costo,
                'total_costo': total_costo,
                'subtotal_venta': subtotal_venta,
                'total_venta': total_venta,
                'iva_costo': iva_costo,
                'utilidad_bruta': utilidad_bruta,
            }
            
            # Agregar el diccionario a la lista de datos
            datos.append(formula_data)
        
        # Devolver los datos en formato JSON
        return JsonResponse({'datos': datos})
    else:
        return JsonResponse({'error': 'Método no permitido'}, status=405)
from .models import Facturas, OrdenProduccion, TransaccionFactura, TransaccionRemision
from django.http import JsonResponse
import json

def PFacturar(request):
    if request.method == 'POST':
        try:
            # Obtener los datos del cuerpo de la solicitud POST
            body_unicode = request.body.decode('utf-8')
            datos_facturacion = json.loads(body_unicode)

            # Parseo de datos recibidos desde JavaScript
            factura_numero = datos_facturacion['factura']
            cliente = datos_facturacion['cliente']
            direccion = datos_facturacion['direccion']
            telefono = datos_facturacion['telefono']
            correo = datos_facturacion['correo']
            orden_id = datos_facturacion['orden']  # Obtener el ID de la orden
            productos = datos_facturacion['productos']
            incluir_iva = datos_facturacion['incluir_iva']
            subtotal = datos_facturacion['subtotal']
            iva = datos_facturacion['iva']
            total = datos_facturacion['total']
            fecha = datos_facturacion['fecha']
            estado = datos_facturacion['estado']

            try:
            
                total_float= total.replace('.','').replace(',','')
                total_guardar = convertir_a_numero(total)
                
                updateEstado = TransaccionOrden.objects.filter(id_orden=orden_id)
                
                updateEstado.update(estado=estado)
                
                


                # Crear instancia de Facturas
                if incluir_iva:
                    modelo_transaccion = TransaccionFactura
                    factura_instance, created_factura = Facturas.objects.get_or_create(
                        nfactura=factura_numero,
                        defaults={
                            'fecha_facturacion': fecha,
                            'total_factura': total_guardar,  # Asegurar formato correcto
                            'id_orden_field': orden_id
                        }
                    )
                else:
                    modelo_transaccion = TransaccionRemision
                    numero_remision = obtener_numero_remision()
                    remision, created_remision = Remisiones.objects.get_or_create(
                        nremision=numero_remision,
                        defaults={
                            'fecha_remision': fecha,
                            'total_remision': total_guardar,  # Asegurar formato correcto
                            'id_orden': orden_id
                        }
                    )

                # Iterar sobre los productos y guardar en el modelo correspondiente
                for producto in productos:
                    
                    if incluir_iva:
                        print('valor producto', producto['costo_unitario'])
                        instancia_transaccion = modelo_transaccion(
                            nfactura=factura_instance,
                            cod_inventario=producto['id_producto'],
                            cantidad= convertir_a_numero_entero(producto['cantidad']),
                            fecha_factura=fecha,
                            precio_venta = convertir_a_numero(producto['costo_unitario']),
                            
                        )
                    else:
                        instancia_transaccion = modelo_transaccion(
                            nremision=remision,
                            cod_inventario=producto['id_producto'],
                            cantidad=convertir_a_numero_entero(producto['cantidad']),
                            fecha_remision=fecha,
                            precio_venta = convertir_a_numero(producto['costo_unitario']),
                        )

                    # Guardar la instancia en la base de datos
                    instancia_transaccion.save()   


                

            except OrdenProduccion.DoesNotExist:
                # Manejar caso donde no se encuentra la orden de producción
                return JsonResponse({'error': 'Orden de producción no encontrada'}, status=404)

            # Devolver una respuesta JSON si lo deseas
            return JsonResponse({'mensaje': 'Datos recibidos correctamente'})

        except json.JSONDecodeError as e:
            # Manejar el error de decodificación JSON
            return JsonResponse({'error': 'Error de decodificación JSON: ' + str(e)}, status=400)

    # Manejar otras solicitudes o devolver un error si es necesario
    return JsonResponse({'error': 'Método de solicitud no permitido'}, status=405)


def obtener_numero_factura(request):
    ultima_factura = None  # Define la variable antes del bloque try
    nueva_factura = None
    
    try:
        ultima_factura = TransaccionFactura.objects.aggregate(Max('nfactura'))['nfactura__max']
        print(ultima_factura)
        if ultima_factura is not None:
            ultima_factura = ultima_factura + 1
        else:
            nueva_factura = 100000001
            print(nueva_factura)
    except Exception as e:
        print(f"Error al obtener o generar el número de ajuste: {e}")
        nueva_factura = None

    data = {'numero_factura': nueva_factura, 'ultima_factura': ultima_factura}
    return JsonResponse(data)

def obtener_numero_remision():
    try:
        # Obtener el número máximo de la última remisión
        ultima_remision = Remisiones.objects.aggregate(Max('nremision'))['nremision__max']
        
        if ultima_remision is not None:
            # Si hay una última remisión, calcular el siguiente número
            nueva_remision = ultima_remision + 1
        else:
            # Si no hay remisiones previas, comenzar desde un número específico
            nueva_remision = 200000001

    except Exception as e:
        print(f"Error al obtener o generar el número de remisión: {e}")
        nueva_remision = None

    # Devolver el número de la nueva remisión
    return nueva_remision

def precio_producto(request):
    if request.method == 'GET':
        cod_inventario = request.GET.get('codigo')
        
        # Lista para almacenar los datos de cada fórmula
        datos = []
        
        try:
            # Obtener la fórmula correspondiente al cod_inventario
            formula = Transformulas.objects.get(cod_inventario=cod_inventario)
            
            # Calcular los valores para la fórmula
            subtotal_costo = 0.0
            total_costo = 0.0
            subtotal_venta = 0.0
            total_venta = 0.0
            iva_costo = 0.0
            utilidad_bruta = 0.0
            
            for i in range(1, 9):  # Iterar sobre los campos materia1 hasta materia8
                campo_materia = getattr(formula, f"materia{i}")
                if campo_materia:  # Verificar si hay un código de materia prima en el campo actual
                    # Consultar la materia prima por su código
                    materia_prima = TransMp.objects.filter(cod_inventario=campo_materia).order_by('-fecha_ingreso').first()
                    if materia_prima:
                        # Asignar el nombre y el costo unitario de la materia prima a la fórmula
                        setattr(formula, f"nombre_mp{i}", materia_prima.nombre_mp)
                        setattr(formula, f"costo_unitario{i}", materia_prima.costo_unitario)
                        cantidad = getattr(formula, f"cant_materia{i}")
                        costo_unitario = getattr(materia_prima, f"costo_unitario")
                        subtotal_costo += cantidad * costo_unitario
                    else:
                        # Asignar valores predeterminados si la materia prima no se encuentra
                        setattr(formula, f"nombre_mp{i}", "Materia prima no encontrada")
                        setattr(formula, f"costo_unitario{i}", 0.0)
            
            # Calcular otros valores necesarios para la fórmula
            iva_costo = (subtotal_costo * formula.porcentajeiva) / 100            
            total_costo = subtotal_costo + formula.costosindirectos + iva_costo
            utilidad_bruta = ((subtotal_costo + formula.costosindirectos) * formula.pocentajeutilidad) / 100
            subtotal_venta = subtotal_costo + formula.costosindirectos + utilidad_bruta
            total_venta = subtotal_venta + (subtotal_venta * formula.porcentajeiva) / 100
            
            # Redondear los valores a dos decimales
            subtotal_costo = round(subtotal_costo, 2)
            total_costo = round(total_costo, 2)
            subtotal_venta = round(subtotal_venta, 2)
            total_venta = round(total_venta, 2)
            iva_costo = round(iva_costo, 2)
            utilidad_bruta = round(utilidad_bruta, 2)
            
            # Crear un diccionario con los datos de la fórmula actual
            formula_data = {
                'id_producto': formula.cod_inventario.cod_inventario,
                'nombre': formula.nombre,
                'iva': formula.porcentajeiva,
                'subtotal_costo': subtotal_costo,
                'total_costo': total_costo,
                'subtotal_venta': subtotal_venta,
                'total_venta': total_venta,
                'iva_costo': iva_costo,
                'utilidad_bruta': utilidad_bruta,
            }
            
            # Agregar el diccionario a la lista de datos
            datos.append(formula_data)
            
            # Devolver los datos en formato JSON
            return JsonResponse({'datos': datos})
        
        except Transformulas.DoesNotExist:
            # Manejar el caso donde no se encontró la fórmula
            return JsonResponse({'error': 'Fórmula no encontrada'}, status=404)
    
    else:
        return JsonResponse({'error': 'Método no permitido'}, status=405)
    
    
def detallesFactura(request):
    factura_id = request.GET.get('factura_id')
    print('N factura', factura_id)
    
    if factura_id:
        try:
            
            
            transacciones = TransaccionFactura.objects.filter(nfactura=factura_id)
            
            productos = []
            for transaccion in transacciones:
                # Obtener detalles del producto desde el modelo Inventario
                producto = Inventario.objects.get(cod_inventario=transaccion.cod_inventario)
                
                # Agregar los detalles del producto a la lista
                productos.append({
                    'cod_inventario': producto.cod_inventario,
                    'nombre': producto.nombre,
                    'cantidad': transaccion.cantidad,
                    'fecha_factura': transaccion.fecha_factura,
                    'precio_unitario': f"{transaccion.precio_venta:,}",
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

def convertir_a_numero_entero(cadena):
    # Reemplazar el punto (.) con nada (eliminar separadores de miles)
    cadena = cadena.replace('.', '')
    # Reemplazar la coma (,) con un punto (.) para el separador decimal
    cadena = cadena.replace(',', '.')
    # Convertir la cadena a un número flotante
    numero = float(cadena)
    
    numero_entero = int(round(numero))
    return numero_entero