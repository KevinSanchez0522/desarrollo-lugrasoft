import json
import os
from pydoc import doc
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, render
from .models import Clientes, TransaccionFactura, TransaccionRemision, Facturas, Remisiones , Inventario, OrdenProduccion, TransaccionOrden, Transformulas, TransMp,Proveedores, Compras
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Max, F
from django.http import HttpResponse
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas # type: ignore
from io import BytesIO
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
from reportlab.lib.units import inch
from django.utils.dateparse import parse_date
from django.db import transaction 
from decimal import Decimal

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

        nombre_cliente = get_object_or_404(Clientes, nit=factura.cliente)
        cliente = nombre_cliente.nombre # `nit` es el campo de clave foránea en OrdenProduccion
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
        # Obtener los IDs de las órdenes seleccionadas
        id_ordenes = request.GET.getlist('ordenes[]')  # Usamos getlist para capturar un array de órdenes
        
        print('array ids', id_ordenes)
        
        # Lista para almacenar los datos organizados por orden
        ordenes_data = []

        # Iterar sobre cada id de orden
        for id_orden in id_ordenes:
            print('ordenes', id_orden)
            # Obtener las transacciones de la orden actual
            transacciones = TransaccionOrden.objects.filter(id_orden=id_orden, estado__in=['por facturar'])

            # Lista para almacenar los productos de la orden actual
            productos = []

            # Iterar sobre cada transacción de la orden
            for transaccion in transacciones:
                cod_inventario = transaccion.cod_inventario
                print('codigos: ', cod_inventario)
                cantidad_transaccion = transaccion.cantidad

                # Obtener la fórmula correspondiente al cod_inventario
                try:
                    formula = Transformulas.objects.get(cod_inventario=cod_inventario)
                except Transformulas.DoesNotExist:
                    continue  # O retornar un JsonResponse con un mensaje de error
                
                # Calcular los valores para la fórmula
                subtotal_costo = 0.0
                total_costo = 0.0
                subtotal_venta = 0.0
                total_venta = 0.0
                iva_costo = 0.0
                utilidad_bruta = 0.0

                # Iterar sobre los campos materia1 hasta materia10
                for i in range(1, 11):
                    campo_materia = getattr(formula, f"materia{i}")
                    if campo_materia:
                        materia_prima = TransMp.objects.filter(cod_inventario=campo_materia).order_by('-fecha_ingreso').first()
                        if materia_prima:
                            setattr(formula, f"nombre_mp{i}", materia_prima.nombre_mp)
                            setattr(formula, f"costo_unitario{i}", materia_prima.costo_unitario)
                            cantidad = getattr(formula, f"cant_materia{i}")
                            costo_unitario = getattr(materia_prima, f"costo_unitario")
                            subtotal_costo += cantidad * costo_unitario
                        else:
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
                    'cantidad': cantidad_transaccion,
                    'iva': formula.porcentajeiva,
                    'subtotal_costo': subtotal_costo,
                    'total_costo': total_costo,
                    'subtotal_venta': subtotal_venta,
                    'total_venta': total_venta,
                    'iva_costo': iva_costo,
                    'utilidad_bruta': utilidad_bruta,
                }

                # Agregar el producto a la lista de productos de la orden actual
                productos.append(formula_data)
            
            # Una vez que hemos procesado todos los productos de la orden, agregamos la orden con sus productos
            ordenes_data.append({
                'id_orden': id_orden,
                'productos': productos
            })
        
        # Devolver los datos de las órdenes con sus productos en formato JSON
        return JsonResponse({'ordenes': ordenes_data})
    
    else:
        return JsonResponse({'error': 'Método no permitido'}, status=405)
    
    
    
from .models import Facturas, OrdenProduccion, TransaccionFactura, TransaccionRemision
from django.http import JsonResponse
import json

@transaction.atomic
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
            incluir_ica = datos_facturacion['incluir_ica']
            subtotal = datos_facturacion['subtotal']
            iva = datos_facturacion['iva']
            total = datos_facturacion['total']
            fecha = datos_facturacion['fecha']
            estado = datos_facturacion['estado']
            lugrascol = 901452546
            print('cliente', cliente, incluir_ica, 'total', total)
            cantidad_decimal = 0

            try:
                # Validación de cliente "lugrascol"
                if cliente == lugrascol:
                    
                    
                    compra_propia = 'Inventario Propio'
                    compra_instance, created_compra = Compras.objects.get_or_create(
                        id_compra=compra_propia,  # Puedes usar el número de factura como 'id_compra', o cualquier otra clave única
                        defaults={
                            'total_factura': 0,  # Asignamos 0 ya que es una transacción especial para "lugrascol"
                            'estado': True  # Asignamos el estado que desees (o como corresponda)
                        }
                    )
                    
                    # Aquí puedes poner lo que deseas hacer si el cliente es "lugrascol"
                    # Por ejemplo, realizar una acción especial, o simplemente permitir continuar con la factura.
                    print("Cliente es Lugrascol, realizando acción especial.")
                    for orden in orden_id:
                        updateEstado = TransaccionOrden.objects.filter(id_orden=orden,estado__in=['por facturar'])
                        updateEstado.update(estado=estado)
                        
                        
                                        # Crear instancia de Facturas
                    if incluir_iva:
                        modelo_transaccion = TransaccionFactura
                        factura_instance, created_factura = Facturas.objects.get_or_create(
                            nfactura=factura_numero,
                            defaults={
                                'fecha_facturacion': fecha,
                                'total_factura': 0,  # Asegurar formato correcto
                                'id_orden_field': int(orden_id[0]),
                                'cliente': cliente,
                                'estado': estado,
                                'ica': incluir_ica
                            }
                        )
                    else:
                        modelo_transaccion = TransaccionRemision
                        numero_remision = obtener_numero_remision()
                        remision, created_remision = Remisiones.objects.get_or_create(
                            nremision=numero_remision,
                            defaults={
                                'fecha_remision': fecha,
                                'total_remision': 0,  # Asegurar formato correcto
                                'id_orden': int(orden_id[0]),
                                'cliente': cliente,
                                'estado': estado
                            }
                        )    

                    
                    
                    for producto in productos:
                        # Crear instancia de TransMp
                        
                        proveedor = Proveedores.objects.get(id_proveedor=cliente)
                        producto_inventario = Inventario.objects.get(cod_inventario=producto['id_producto'])
                        total_linea = convertir_a_numero_entero(producto['cantidad'])*convertir_a_numero(producto['costo_unitario'])
                        transmp_instance = TransMp.objects.create(
                            nombre_mp=producto_inventario.nombre,  # Asegúrate de que 'nombre_mp' está en 'producto'
                            cant_mp=convertir_a_numero_entero(producto['cantidad']),  # Usamos la función para convertir cantidad
                            costo_unitario=convertir_a_numero(producto['costo_unitario']),  # Convierte a número el costo
                            total_linea=total_linea,  # Puedes calcular el total aquí si es necesario
                            fecha_ingreso=fecha,  # Usa la fecha que recibes en el cuerpo de la solicitud
                            unidad_medida='Unidad',
                            id_proveedor=proveedor.id_proveedor,  # Asegúrate de que 'id_proveedor' esté en 'producto'
                            cod_inventario=producto_inventario,  # Relacionamos con el inventario
                            tipo='m',  # Si no hay 'tipo', se usa un valor vacío
                            id_compra=compra_instance  # Asegúrate de que 'id_compra' esté en 'producto'
                        )
                        if incluir_iva:
                            
                            instancia_transaccion = modelo_transaccion(
                                nfactura=factura_instance,
                                cod_inventario=producto['id_producto'],
                                cantidad=float(producto['cantidad']),
                                fecha_factura=fecha,
                                precio_venta=0,
                            )


                        else:
                            instancia_transaccion = modelo_transaccion(
                                nremision=remision,
                                cod_inventario=producto['id_producto'],
                                cantidad=float(producto['cantidad']),
                                fecha_remision=fecha,
                                precio_venta=0,
                            )




                        # Guardar la instancia en la base de datos
                        instancia_transaccion.save()
                            


                else:
                    # Si no es "lugrascol", proceder con el proceso de facturación normal
                    total_guardar = convertir_a_numero(total)
                    print('total guardar', total_guardar)
                    for orden in orden_id:
                        updateEstado = TransaccionOrden.objects.filter(id_orden=orden, estado__in=['por facturar'])
                        updateEstado.update(estado=estado)

                    # Crear instancia de Facturas
                    if incluir_iva:
                        modelo_transaccion = TransaccionFactura
                        factura_instance, created_factura = Facturas.objects.get_or_create(
                            nfactura=factura_numero,
                            defaults={
                                'fecha_facturacion': fecha,
                                'total_factura': total_guardar,  # Asegurar formato correcto
                                'id_orden_field': int(orden_id[0]),
                                'cliente': cliente,
                                'estado': estado,
                                'ica': incluir_ica
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
                                'id_orden': int(orden_id[0]),
                                'cliente': cliente,
                                'estado': estado
                            }
                        )

                    # Iterar sobre los productos y guardar en el modelo correspondiente
                    for producto in productos:
                        if incluir_iva:
                            print('valor producto', producto['costo_unitario'])
                            producto_inventario = Inventario.objects.get(cod_inventario=producto['id_producto'])
                            cantidad_str = producto['cantidad']
                            if ',' in cantidad_str:
                                cantidad_str = cantidad_str.replace(',', '.')
                            
                            cantidad_decimal = Decimal(cantidad_str)
                            print('valor de cantidad convertir numero', cantidad_decimal)
                            #cantidadF= Decimal(cantidad_decimal)
                            #print('valor de cantidad transformado', cantidadF)
                            nueva_cantidad = producto_inventario.cantidad - cantidad_decimal
                            instancia_transaccion = modelo_transaccion(
                                nfactura=factura_instance,
                                cod_inventario=producto['id_producto'],
                                cantidad=cantidad_decimal,
                                fecha_factura=fecha,
                                
                                precio_venta=convertir_a_numero(producto['costo_unitario']),
                            )

                            producto_inventario.cantidad = nueva_cantidad
                            producto_inventario.save()
                            print(f'Inventario actualizado para el producto {producto["id_producto"]}. Nueva cantidad: {nueva_cantidad}')
                        else:
                            print('cantidaad producto original', producto['cantidad'])
                            
                            cantidad_str = producto['cantidad']
                            if ',' in cantidad_str:
                                cantidad_str = cantidad_str.replace(',', '.')
                            cantidad_decimal = Decimal(cantidad_str)
                            print('valor de cantidad convertir a numero', cantidad_decimal)
                            #cantidadF = Decimal(cantidad_decimal)
                            #print('valor de cantidad transformado', cantidadF)
                            instancia_transaccion = modelo_transaccion(
                                nremision=remision,
                                cod_inventario=producto['id_producto'],
                                cantidad=cantidad_decimal,
                                fecha_remision=fecha,
                                precio_venta=convertir_a_numero(producto['costo_unitario']),
                            )
                            producto_inventario = Inventario.objects.get(cod_inventario=producto['id_producto'])
                            nueva_cantidad = producto_inventario.cantidad - cantidad_decimal

                            producto_inventario.cantidad = nueva_cantidad
                            producto_inventario.save()
                            print(f'Inventario actualizado para el producto {producto["id_producto"]}. Nueva cantidad: {nueva_cantidad}')

                        # Guardar la instancia en la base de datos
                        instancia_transaccion.save()

                    # Generar y devolver el PDF de la factura
                    pdf_buffer = generar_pdf(factura_numero, cliente, direccion, telefono, correo, productos, total, fecha, estado)
                    response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
                    response['Content-Disposition'] = f'attachment; filename=factura_{factura_numero}.pdf'
                    return response

            except OrdenProduccion.DoesNotExist:
                # Manejar caso donde no se encuentra la orden de producción
                return JsonResponse({'error': 'Orden de producción no encontrada'}, status=404)

            # Devolver una respuesta JSON si todo se ha procesado correctamente
            return JsonResponse({'mensaje': 'Datos recibidos correctamente'})

        except json.JSONDecodeError as e:
            # Manejar el error de decodificación JSON
            return JsonResponse({'error': 'Error de decodificación JSON: ' + str(e)}, status=400)

    # Manejar otras solicitudes o devolver un error si es necesario
    return JsonResponse({'error': 'Método de solicitud no permitido'}, status=405)

def generar_pdf(factura_numero, cliente, direccion, telefono, correo, productos, total, fecha, estado):
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    content = []
    
    # Estilos para el documento
    styles = getSampleStyleSheet()
    title_style = styles['Title']
    header_style = styles['Heading2']
    normal_style = styles['BodyText']
    styleN = styles['Normal']
    
    # Datos de cabecera
    content.append(Paragraph(f'Orden de Salida: {factura_numero}', title_style))
    content.append(Paragraph(f'Cliente: {cliente}', normal_style))
    content.append(Paragraph(f'Dirección: {direccion}', normal_style))
    content.append(Paragraph(f'Teléfono: {telefono}', normal_style))
    content.append(Paragraph(f'Correo: {correo}', normal_style))
    content.append(Paragraph(f'Fecha: {fecha}', normal_style))
    content.append(Paragraph(f'Estado: {estado}', normal_style))
    content.append(Paragraph(' ', normal_style))  # Espacio en blanco
    
    # Encabezado de la tabla
    table_data = [['ID Producto', 'Nombre Producto', 'Cantidad', 'Precio Unitario', 'Total']]
    
    # Datos de los productos
    for producto in productos:
        costo = convertir_a_numero(producto['costo_unitario'])
        cantidad= convertir_a_numero_entero(producto['cantidad'])
        table_data.append([
            producto['id_producto'],
            Paragraph(producto['nombre'], styleN),
            cantidad,
            costo,
            f"${cantidad * costo:.2f}"
        ])
    
    # Añadir total
    table_data.append(['', '', '', 'Subtotal:', f"${total}"])
    
    # Crear la tabla
    table = Table(table_data, colWidths=[1.0*inch, 2.5*inch, 1.0*inch, 1.0*inch, 1.0*inch])
    
    # Estilo de la tabla
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), '#d0d0d0'),
        ('TEXTCOLOR', (0, 0), (-1, 0), '#000000'),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('ALIGN', (0, 1), (-1, -1), 'CENTER'),
        ('BACKGROUND', (0, 1), (-1, -1), '#f9f9f9'),
        ('GRID', (0, 0), (-1, -1), 1, '#000000'),
    ]))
    
    content.append(table)
    
    # Crear el documento
    doc.build(content)
    

    buffer.seek(0)
    return buffer


def descargar_pdf(request, factura_numero):
    pdf_file_path = f'/tmp/factura_{factura_numero}.pdf'
    if os.path.exists(pdf_file_path):
        with open(pdf_file_path, 'rb') as f:
            response = HttpResponse(f.read(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename=factura_{factura_numero}.pdf'
            return response
    else:
        return JsonResponse({'error': 'Archivo no encontrado'}, status=404)

def obtener_numero_factura(request):
    ultima_factura = None  # Define la variable antes del bloque try
    nueva_factura = None
    
    try:
        ultima_factura = Facturas.objects.aggregate(Max('nfactura'))['nfactura__max']
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
            print('codigo', formula.cod_inventario.cod_inventario)
            
            # Calcular los valores para la fórmula
            subtotal_costo = 0.0
            total_costo = 0.0
            subtotal_venta = 0.0
            total_venta = 0.0
            iva_costo = 0.0
            utilidad_bruta = 0.0
            
            for i in range(1, 11):  # Iterar sobre los campos materia1 hasta materia8
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
                        # Si no se encuentra la fórmula, buscar en TransMp
            materia_prima = TransMp.objects.filter(cod_inventario=cod_inventario).order_by('-fecha_ingreso').first()
            if materia_prima:
                # Crear un diccionario con los datos del producto
                producto_data = {
                    'id_producto': materia_prima.cod_inventario.cod_inventario,  # Asumir que es el ID del producto
                    'nombre': materia_prima.nombre_mp,
                    'iva': 0.0,  # No tiene IVA en este caso, pero puedes agregar la lógica
                    'subtotal_costo': materia_prima.costo_unitario,  # Suponiendo que el costo unitario es el costo del producto
                    'total_costo': materia_prima.costo_unitario,  # Suponiendo que no hay costos adicionales
                    'subtotal_venta': materia_prima.costo_unitario,  # Similar, dependiendo de la lógica de tu negocio
                    'total_venta': materia_prima.costo_unitario,  # Sin cálculo de IVA si no hay detalles
                    'iva_costo': 0.0,  # Suponiendo que no hay IVA
                    'utilidad_bruta': 0.0,  # Sin cálculo de utilidad si no es necesario
                }
                datos.append(producto_data)
                return JsonResponse({'datos': datos})

            else:
                # Si no se encuentra el producto en TransMp
                return JsonResponse({'error': 'Producto no encontrado en TransMp'}, status=404)
    
    else:
        return JsonResponse({'error': 'Método no permitido'}, status=405)
    
    
def detallesFactura(request):
    factura_id = request.GET.get('factura_id')
    print('N factura', factura_id)
    
    if factura_id:
        try:
            
            
            transacciones = TransaccionFactura.objects.filter(nfactura=factura_id)
            factura= get_object_or_404(Facturas, nfactura= factura_id)
            cliente = get_object_or_404(Clientes, nit=factura.cliente)
            
            #iva= factura.total_factura* 0.19
            #iva_redondeado = round(iva,2)
            #subtotal = factura.total_factura - iva_redondeado
            ica= factura.ica
            total_factura= factura.total_factura
            print('tiene ica:', ica, 'factura', total_factura)
            total=0 
            valorIca=0   
            
            productos = []
            for transaccion in transacciones:
                # Obtener detalles del producto desde el modelo Inventario
                producto = Inventario.objects.get(cod_inventario=transaccion.cod_inventario)
                transaccion_total = transaccion.cantidad * Decimal(transaccion.precio_venta)
                
                if Transformulas.objects.filter(cod_inventario=producto.cod_inventario).exists():
                    producto_transformula = Transformulas.objects.get(cod_inventario=producto.cod_inventario)
                    peso = producto_transformula.peso
                else:
                    peso = 0
                
                
                
                
                total+=transaccion_total
                
                subtotal= round(total/Decimal(1.19))
                iva= round(total-subtotal)
                if ica:
                    valorIca=subtotal*2.5/100
                    
                else:
                    valorIca=0
                
                # Agregar los detalles del producto a la lista
                productos.append({
                    'cod_inventario': producto.cod_inventario,
                    'nombre': producto.nombre,
                    'cantidad': '{:.0f}'.format(transaccion.cantidad) if transaccion.cantidad == int(transaccion.cantidad) or round(transaccion.cantidad, 2) == int(transaccion.cantidad) else f"{transaccion.cantidad:.2f}",
                    'fecha_factura': transaccion.fecha_factura,
                    'precio_unitario': f"{transaccion.precio_venta:,}",
                    'total_factura': f"{total_factura:,}",
                    'nit_cliente': cliente.nit,
                    'nombre_cliente': cliente.nombre,
                    'telefono_cliente': cliente.telefono,
                    'direccion_cliente': cliente.direccion,
                    'correo_cliente': cliente.email,
                    'iva': f"{iva:,}",
                    'subtotal': f"{subtotal:,}",
                    'ica': f"{valorIca:,}",
                    'peso':peso,
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



def editarFacturas(request, nfactura):
    transacciones = TransaccionFactura.objects.filter(nfactura=nfactura)
    
    datos = get_object_or_404(Facturas, nfactura=nfactura)
    
    primeraTransaccion = transacciones.first()
    fecha_factura = primeraTransaccion.fecha_factura
    numero_factura = primeraTransaccion.nfactura
    orden = datos.id_orden_field

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
    
    return render(request, 'editarFactura.html', context)


def editarFactura(request):
    if request.method == 'POST':
        try:
            # Leer los datos JSON del cuerpo de la solicitud
            data = json.loads(request.body)
            factura = data.get('factura')
            totalFactura = data.get('totalFactura')
            productos = data.get('filas')
            
            
            # Filtrar las transacciones por número de factura
            transacciones = TransaccionFactura.objects.filter(nfactura=factura)
            
            
            
            facturas = get_object_or_404(Facturas, nfactura=factura)
            facturas.total_factura = convertir_a_numero(totalFactura)
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
    
    
def anularFactura(request, nfactura):
    if request.method == 'POST':
        
        estado = 'por facturar'
        # Filtrar las transacciones asociadas a la factura
        transacciones = TransaccionFactura.objects.filter(nfactura=nfactura)
        factura = get_object_or_404(Facturas, nfactura=nfactura)
        factura.total_factura = 0
        factura.estado = 'anulado'
        factura.save()
        
        
        codigos_transaccion_factura = TransaccionFactura.objects.filter(nfactura = nfactura)
        productos_facturados = TransaccionOrden.objects.filter(id_orden= factura.id_orden_field, estado='facturado')
        for codigos in codigos_transaccion_factura:
            producto_transaccion_orden = productos_facturados.filter(cod_inventario=codigos.cod_inventario).first()
            if producto_transaccion_orden:
                producto_transaccion_orden.estado = 'por facturar'
                producto_transaccion_orden.save()
            else:
                print(f"No se encontró la transacción de orden para el producto con cod_inventario {codigos.cod_inventario}")
        
        
        '''
        updateEstado = TransaccionOrden.objects.filter(id_orden=factura.id_orden_field, estado='facturado')
        updateEstado.update(estado=estado)
        if not transacciones.exists():
            return JsonResponse({'error': 'No se encontraron transacciones para esta factura'}, status=404)
        '''

        
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



def buscarXfecha(request):
    
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



def retornoItemProduccion(request):
    if request.method == 'POST':
        # Obtener datos del formulario
        id_orden = request.POST.get('orden')
        id_item = request.POST.get('cod_inventario')
        
        ordenes= TransaccionOrden.objects.filter(id_orden = id_orden, cod_inventario = id_item)
        item_por_facturar = ordenes.filter(estado = 'por facturar').first()
        item_en_proceso = ordenes.filter(estado = 'en proceso').first()

        
        if item_en_proceso and item_por_facturar:
            
            
            print('cantidad a devolver existe un producto en proceso  ')
            item_en_proceso.cantidad += item_por_facturar.cantidad
            item_en_proceso.save()
            item_por_facturar.delete()
            
            
        elif item_por_facturar and not item_en_proceso:
            
            print('estado a cambiar unico producto')
            item_por_facturar.estado = 'en proceso'
            item_por_facturar.save()
            
                
        
        
        
        
        
        response_data = {
            'status': 'success',
            'message': 'Item devuelto correctamente',
            'orden': id_orden,
            'cod_inventario': id_item
        }
        return JsonResponse(response_data)

    # Si el método no es POST, podemos retornar un error.
    return JsonResponse({'status': 'error', 'message': 'Método no permitido'}, status=405)