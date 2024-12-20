import json
from urllib import request
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect, render


from facturacion.models import Clientes, Inventario, OrdenProduccion, Transformulas, TransaccionOrden, SalidasMpOrden
from django.db.models import Max, F
from django.contrib.auth.models import User, Group
from django.db import transaction
from django.db.models import Case, When, IntegerField, Value, CharField,Min


# Create your views here.
def pedido(request):
    cliente = Clientes.objects.all()
    producto = Inventario.objects.filter(tipo='pt')
    nombre_grupo = "Produccion"
    grupo = Group.objects.get(name=nombre_grupo)
    usuarios = User.objects.filter(groups=grupo)
    return render(request, 'pedidos1.html', {'clientes': cliente, 'productos': producto, 'usuarios': usuarios})



def add_cliente(request):
        if request.method == 'POST':
            nit = request.POST.get('nit')
            nombre = request.POST.get('name')
            direccion = request.POST.get('direccion')
            telefono = request.POST.get('telefono')
            email = request.POST.get('email')
            print('ingresamos a add cliente')

            # Verificar si ya existe un proveedor con el mismo NIT
            if Clientes.objects.filter(nit=nit).exists():
                # Mostrar una alerta indicando que el proveedor ya existe
                return JsonResponse({'clientes_existente': True})

            # Crear una nueva instancia del modelo Proveedor y guardarla en la base de datos
            nuevo_Cliente = Clientes(nit=nit, nombre=nombre, direccion=direccion, telefono=telefono, email=email)
            nuevo_Cliente.save()

            # Devolver al usuario a la URL anterio
            return redirect('pedidos')

def obtener_numero_produccion(request):
    ultima_averia = None  # Define la variable antes del bloque try
    
    try:
        ultima_produccion = OrdenProduccion.objects.aggregate(Max('id_orden'))['id_orden__max']
        print(ultima_averia)
        if ultima_produccion is not None:
            nueva_produccion = ultima_produccion + 1
        else:
            nueva_produccion = 40001
            print(nueva_produccion)
    except Exception as e:
        print(f"Error al obtener o generar el número de ajuste: {e}")
        nueva_produccion = None

    data = {'numero_orden': nueva_produccion, 'ultimo_produccido': ultima_produccion}
    return JsonResponse(data)



def obtener_materias_primas(request):
    producto_id = request.GET.get('producto_id')
    if producto_id:
        try:
            formula = Transformulas.objects.get(cod_inventario=producto_id)
            materias_primas = {
                'materia1': (formula.materia1, formula.cant_materia1),
                'materia2': (formula.materia2, formula.cant_materia2),
                'materia3': (formula.materia3, formula.cant_materia3),
                'materia4': (formula.materia4, formula.cant_materia4),
                'materia5': (formula.materia5, formula.cant_materia5),
                'materia6': (formula.materia6, formula.cant_materia6),
                'materia7': (formula.materia7, formula.cant_materia7),
                'materia8': (formula.materia8, formula.cant_materia8),
                'materia9': (formula.materia9, formula.cant_materia9),
                'materia10': (formula.materia10, formula.cant_materia10),
            }
            # Filtrar los campos vacíos y obtener nombres y cantidades del inventario
            materias_primas = {k: v for k, v in materias_primas.items() if v[0] is not None}

            detalles_materias_primas = []
            for key, (materia_id, cantidad_requerida) in materias_primas.items():
                inventario = get_object_or_404(Inventario, pk=materia_id)
                detalles_materias_primas.append({
                    'codigo': inventario.cod_inventario,
                    'nombre': inventario.nombre,
                    'cantidad_requerida': cantidad_requerida,
                    'cantidad_actual': inventario.cantidad,  # Asumiendo que hay un campo `cantidad` en Inventario
                })

            return JsonResponse({'success': True, 'materias_primas': detalles_materias_primas})
        except Transformulas.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Fórmula no encontrada'})
    return JsonResponse({'success': False, 'error': 'ID de producto no proporcionado'})


@transaction.atomic
def crear_transaccion_orden(request):
    if request.method == 'POST':
        # Obtener los datos enviados desde el frontend en formato JSON
        try:
            datosEnviar = json.loads(request.body.decode('utf-8'))
            
            # Extraer los datos específicos del objeto JSON principal
            numero_factura = datosEnviar.get('numero_factura')
            fecha_actual = datosEnviar.get('fecha_actual')
            fecha_estimada_entrega = datosEnviar.get('fecha_estimada_entrega')
            id_cliente = datosEnviar.get('id_cliente')
            responsable = datosEnviar.get('responsable')
            prioridad = datosEnviar.get('prioridad')
            detallesProductos = datosEnviar.get('detallesProductos')
            
            # Obtener el cliente
            cliente = get_object_or_404(Clientes, nit=id_cliente)
            
            # Buscar o crear la instancia de OrdenProduccion
            orden_produccion, creado = OrdenProduccion.objects.get_or_create(
                id_orden=numero_factura,
                nit=cliente
            )
            
            # Iterar sobre los detalles de productos
            for detalle in detallesProductos:
                producto_id = detalle.get('producto_id')
                cantidad = detalle.get('cantidad')
                
                # Obtener el inventario
                inventario = get_object_or_404(Inventario, pk=producto_id)
                
                # Crear la transacción de orden
                nueva_transaccion_orden = TransaccionOrden.objects.create(
                    fecha_entrega=fecha_estimada_entrega,
                    estado='creado',
                    cod_inventario=inventario,
                    cantidad=float(cantidad),
                    id_orden=orden_produccion,
                    prioridad=prioridad,
                    fecha_creacion=fecha_actual,
                    responsable=responsable,
                )
                nueva_transaccion_orden.save()
            
            return JsonResponse({'message': 'Transacción creada correctamente'}, status=201)
        
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    
    return JsonResponse({'error': 'Método no permitido'}, status=405)

# vistas para manejar la ventana orden de pedidos en curso
def ver_orden_en_curso(request):
        subquery = TransaccionOrden.objects.values('id_orden').annotate(
        min_fecha_entrega=Min('fecha_entrega')
        )
    
        transacciones = TransaccionOrden.objects.filter(
            id__in=subquery.values('id'), 
            fecha_entrega__in=subquery.values('min_fecha_entrega')
        ).exclude(
            estado='facturado'
        ).annotate(
            prioridad_order=Case(
                When(prioridad='urgente', then=Value(1)),
                When(prioridad='menos urgente', then=Value(2)),
                default=Value(3),
                output_field=CharField(),
            )
        ).order_by(
            'prioridad_order', 'id_orden', 'fecha_entrega'
        ).distinct('prioridad_order', 'id_orden', 'fecha_entrega')

        context = {
            'transacciones': transacciones,
        }
        return render(request, 'orden_en_curso.html', context)




def detalles_orden(request, id_orden):
    try:
        detalles = TransaccionOrden.objects.filter(id_orden = id_orden, estado__in=['creado', 'en proceso'])

        
        detalle_list = []
        for detalle in detalles:
            cod_inventario = detalle.cod_inventario.cod_inventario if detalle.cod_inventario else None 
            
            if cod_inventario:
                # Consultar el nombre correspondiente al cod_inventario en el modelo Inventario
                inventario_obj = Inventario.objects.filter(cod_inventario=cod_inventario).first()
                if inventario_obj:
                    nombre_inventario = inventario_obj.nombre
            
            detalle_data = {
                'cod_inventario': cod_inventario,
                'nombre':nombre_inventario,
                'cantidad': detalle.cantidad,
                'fecha_entrega': detalle.fecha_entrega,
                'prioridad': detalle.prioridad,
                'responsable': detalle.responsable,
                'estado': detalle.estado,
                'etiquetado':  detalle.etiquetado,
                'responsables': detalle.responsables,
                'terminado': detalle.terminado

            }
            detalle_list.append(detalle_data)
            # Devolver los datos como una respuesta JSON
        return JsonResponse({'detalles': detalle_list})

    except Exception as e:
        # Manejar cualquier error y devolver una respuesta de error
        return JsonResponse({'error': str(e)}, status=500)
    
    
def actualizar_inventario(cod_inventario, cantidad_requerida):
    try:
        # Obtener el objeto Inventario correspondiente al código de inventario
        inventario = Inventario.objects.get(cod_inventario=cod_inventario)
        
        # Actualizar la cantidad en el inventario
        inventario.cantidad = float(inventario.cantidad)-cantidad_requerida
        inventario.save()

        return True
    except Inventario.DoesNotExist:
        return False
    except Exception as e:
        # Manejar cualquier otro tipo de error
        print(f"Error al actualizar inventario: {str(e)}")
        return False

def producir(request):
    if request.method == 'POST':
        datos_materias_primas = request.POST.get('materias_primas_totales')
        idOrden = request.POST.get('id_orden')
        estado = request.POST.get('CambiarEstado', 'en proceso')
        fechaActual = request.POST.get('fecha')
        print('fecha actual:' , fechaActual)

        try:
            # Convertir el JSON a un objeto Python
            materias_primas = json.loads(datos_materias_primas)
            orden = json.loads(idOrden)
            
            
            
            transacciones = TransaccionOrden.objects.filter(id_orden=idOrden)
            
            # Iterar sobre las transacciones y actualizar el estado
            for transaccion in transacciones:
                transaccion.estado = estado
                transaccion.save()
            
            
            
            
            
            
            obj_orden = get_object_or_404(OrdenProduccion , pk=orden)

            for codigo, materia_prima in materias_primas.items():
                cantidad_requerida = materia_prima['cantidadRequerida']

                # Aquí debes obtener el objeto 'Inventario' correspondiente al 'codigo'
                # Puedes hacerlo dependiendo de cómo esté definida tu relación ForeignKey
                # Por ejemplo:
                cod_inventario = Inventario.objects.get(cod_inventario=codigo)

                # Crear una instancia de SalidasMpOrden y guardarla
                salida_mp_orden = SalidasMpOrden(
                    cod_inventario=     cod_inventario,
                    cantidad=float(cantidad_requerida),
                    id_orden=obj_orden,  # Asegúrate de que 'idOrden' sea válido
                    fecha_e_produccion = fechaActual,
                )
                salida_mp_orden.save()
                
                # Actualizar el inventario correspondiente
                actualizado = actualizar_inventario(codigo, float(cantidad_requerida))
                if not actualizado:
                    return JsonResponse({'error': f'Error al actualizar inventario para el código {codigo}.'}, status=500)


            return JsonResponse({'message': 'Datos recibidos y almacenados correctamente.'})
        
        except json.JSONDecodeError as e:
            return JsonResponse({'error': 'Error al decodificar los datos JSON.'}, status=400)
        
    return JsonResponse({'error': 'Método no permitido.'}, status=400)




def irAfacturar (request):
    if request.method == 'POST':
        idOrden = request.POST.get('id_orden')
        estado = request.POST.get('CambiarEstado', 'por facturar')
        fechaActual = request.POST.get('fecha')
        materias_primas = request.POST.get('productosTerminados')
        print('productos', materias_primas)

        try:
            materias_primas = json.loads(materias_primas)
            # Filtrar las transacciones relacionadas con la orden
            transacciones = TransaccionOrden.objects.filter(id_orden=idOrden)

            # Iterar sobre las transacciones y actualizar el estado
            for transaccion in transacciones:
                #transaccion.estado = estado
                #transaccion.fecha_terminacion_orden = fechaActual
                #transaccion.save()
                # Obtener el cod_inventario y cantidad de la transacción
                cod_inventario = transaccion.cod_inventario.cod_inventario
                print('codigo',cod_inventario)
                cantidad = transaccion.cantidad
                print('cantidad en la base de datos',cantidad)
                for producto in materias_primas:
                    
                    print('producto', producto['cod_inventario'])
                    if int(producto['cod_inventario']) == int(cod_inventario):
                        print('los codigos existen y estan')
                        cantidad_recibida = float(producto['cantidad'])
                        print(f'Comparando cantidad recibida: {cantidad_recibida} con cantidad de la transacción: {cantidad}')
                        if cantidad_recibida == cantidad:
                            transaccion.estado = estado
                            transaccion.fecha_terminacion_orden = fechaActual
                            print(f'Las cantidades coinciden. Actualizando estado de la transacción para facturar el producto {producto["cod_inventario"]}')
                            transaccion.save()

                            # Actualizar el inventario correspondiente
                            inventario = get_object_or_404(Inventario, cod_inventario=cod_inventario)
                            inventario.cantidad += cantidad
                            inventario.save()
                            print(f'Inventario actualizado: {inventario.cod_inventario}, nueva cantidad: {inventario.cantidad}')
                        elif cantidad_recibida < cantidad:
                            print(f'La cantidad recibida es menor. Se va a crear una transacción auxiliar para facturar {producto["cod_inventario"]}')
                            
                            if not TransaccionOrden.objects.filter(id_orden=idOrden, cod_inventario=cod_inventario, cantidad=cantidad_recibida,estado='por facturar').exists():
                                nueva_transaccion = TransaccionOrden.objects.create(
                                    id_orden=transaccion.id_orden,
                                    cod_inventario=transaccion.cod_inventario,
                                    cantidad=cantidad_recibida,
                                    estado='por facturar',  # O el estado que corresponda
                                    fecha_creacion=transaccion.fecha_creacion,
                                    fecha_entrega= transaccion.fecha_entrega,
                                    prioridad= transaccion.prioridad
                                )
                                #nueva_transaccion.save()
                                print(f'Nueva transacción creada: cod_inventario={producto["cod_inventario"]}, cantidad={cantidad_recibida}')
                                total = cantidad - cantidad_recibida
                                print(f'Cantidad restante para producción: {total}')
                                transaccion.cantidad =  total
                                
                                transaccion.save()
                                
                                # Actualizamos el inventario, sumando la cantidad recibida
                                inventario = get_object_or_404(Inventario, cod_inventario=cod_inventario)
                                inventario.cantidad = cantidad_recibida  # sumamos la cantidad del inventario
                                inventario.save()  # Guardamos el inventario actualizado
                                print(f'Inventario actualizado después de la transacción auxiliar: {inventario.cod_inventario}, nueva cantidad: {inventario.cantidad}')
                                
                            else:
                                print(f'Ya existe una transacción auxiliar para este producto {producto["cod_inventario"]}. No se creará una nueva.')


            return JsonResponse({'message': 'Datos recibidos y almacenados correctamente.'})
        
        except json.JSONDecodeError as e:
            return JsonResponse({'error': 'Error al decodificar los datos JSON.'}, status=400)
        
    return JsonResponse({'error': 'Método no permitido.'}, status=400)


def eliminarOrdenProduccion(request):
    if request.method == 'POST':
        id_orden = request.POST.get('id_orden')
        ordenes = TransaccionOrden.objects.filter(id_orden=id_orden, estado='creado')
        
        if ordenes.exists():  # Si hay alguna orden con estado 'creado'
            for orden in ordenes:
                # Eliminar las órdenes
                orden.delete()
                
            modeloOrden = get_object_or_404(OrdenProduccion, id_orden=id_orden)    
            modeloOrden.delete()        
            return JsonResponse({'status': 'success', 'message': 'Orden eliminada.'})
        else:
            return JsonResponse({'status': 'error', 'message': 'La orden no está en estado creado.'})

    return JsonResponse({'status': 'error', 'message': 'Método no permitido.'})


def ActualizarInfoItem(request):
    if request.method == 'POST':
        # Obtener los datos enviados desde el frontend
        data = json.loads(request.body)
        id_orden = data.get('idOrden')  # Obtener el id de la orden
        productos = data.get('productos')  # Obtener la lista de productos  
        print('productos desde el front', productos)

        # Verificar si los datos están presentes
        if not id_orden or not productos:
            return JsonResponse({'error': 'Datos incompletos'}, status=400)
        
        # Obtener la transacción (orden) a actualizar
        try:
            transaccion = TransaccionOrden.objects.filter(id_orden=id_orden)  # Asume que hay una relación entre id_orden y la orden
        except TransaccionOrden.DoesNotExist:
            return JsonResponse({'error': 'Orden no encontrada'}, status=404)
        
        # Procesar los productos enviados
        for producto in productos:
            cod_inventario = producto['cod_inventario']
            etiquetado = True if producto['etiquetado'] == "1" else False  # Convertir el 1 a True, 0 a False
            responsable = producto['responsable']
            terminado = True if producto['terminado'] == "1" else False  # Convertir el 1 a True, 0 a False
            
            # Buscar el producto asociado con el código de inventario en la base de datos
            try:
                producto_obj = transaccion.get(cod_inventario__cod_inventario=cod_inventario, estado__in=['en proceso'])
                
                # Si se encuentra el producto, actualizar los campos
                producto_obj.etiquetado = etiquetado
                producto_obj.responsables = responsable
                producto_obj.terminado = terminado
                
                # Guardar los cambios
                producto_obj.save()

            except producto.DoesNotExist:
                continue  # Si el producto no se encuentra, pasamos al siguiente producto

        return JsonResponse({'success': True, 'message': 'Datos actualizados correctamente'})

    return JsonResponse({'error': 'Método no permitido'}, status=405)



def EliminarItemOrden(request):
    if request.method == 'POST':
        
        # Obtener los datos enviados desde el frontend
        data = json.loads(request.body)
        id_orden = data.get('idOrden')  # Obtener el id de la orden
        cod_inventario = data.get('id')  # Obtener el código de inventario
        cantidad =  data.get('cantidad')
        
        transacciones= TransaccionOrden.objects.filter(id_orden=id_orden, estado__in=['en proceso'])
        if transacciones.exists():
            transaccion = transacciones.get(cod_inventario__cod_inventario=cod_inventario)
            if transaccion.estado == 'creado':
                print('el item va a ser eliminado', transaccion.cod_inventario)
                transaccion.delete()
            elif transaccion.estado == 'en proceso':
                print('el item  va a devolver las materias primas')
                materias_primas = Transformulas.objects.get(cod_inventario=cod_inventario)
                print('codigo de formula', materias_primas.cod_inventario.cod_inventario)
                materias = {}

                # Iterar para obtener las materias y cantidades
                for i in range(1, 11):  # Dado que tienes materia1 a materia10, y cant_materia1 a cant_materia10
                    materia_field = f'materia{i}'  # Forma el nombre del campo materia1, materia2, ..., materia10
                    cant_materia_field = f'cant_materia{i}'  # Forma el nombre del campo cant_materia1, cant_materia2, ..., cant_materia10
                    
                    # Usar getattr para obtener los valores de los campos
                    materia = getattr(materias_primas, materia_field, None)
                    cant_materia = getattr(materias_primas, cant_materia_field, None)
                    
                    # Si la materia y su cantidad existen, los añadimos al diccionario
                    if materia and cant_materia:
                        materias[materia] = cant_materia

                # Ahora 'materias' tiene un diccionario con las materias y sus cantidades
                print(materias)
                for materia, cant_materia in materias.items():
                    try:
                        # Verificar si 'cant_materia' es un valor numérico válido
                        if cant_materia is not None:
                            cant_materia = float(cant_materia)  # Convertir cant_materia a float
                        else:
                            raise ValueError(f"Cantidad de materia {materia} es inválida (None).")

                        # Verificar si 'cantidad' es un valor numérico válido
                        if cantidad is not None:
                            cantidad = float(cantidad)  # Convertir cantidad a float
                        else:
                            raise ValueError(f"Cantidad recibida es inválida (None).")

                        # Buscar la materia en el modelo Inventarios por el código
                        inventario = Inventario.objects.get(cod_inventario=materia)
                        
                        # Calcular la cantidad total
                        cantidad_total = cant_materia * cantidad
                        cantidades_actuales = float(inventario.cantidad)
                        print(cantidades_actuales)
                        cantidad_a_guardar = cantidad_total+cantidades_actuales

                        # Asegurarnos de que el inventario tiene la cantidad que necesitamos
                        inventario.cantidad = cantidad_a_guardar  # Sumamos la cantidad al inventario existente
                        inventario.save()  # Guardamos los cambios

                        print(f'Inventario actualizado para {materia}: nueva cantidad es {inventario.cantidad}')

                    except ValueError as ve:
                        print(f"Error de valor: {ve}")
                    except Inventario.DoesNotExist:
                        print(f'No se encontró la materia con el código {materia} en el inventario')
                    except Exception as e:
                        print(f'Ocurrió un error al actualizar el inventario para {materia}: {e}')
            print(f'Eliminando transacción con código de inventario {cod_inventario}')
            transaccion.delete()
            
            
            return JsonResponse({'success': True, 'message': 'Item eliminado correctamente'})
        else:
            return JsonResponse({'error': 'No se encontró la orden'}, status=404)
        
        
        
def remontarOrden(request, id_orden):
    print(f"Recibido id_orden: {id_orden}")
    transaccion = TransaccionOrden.objects.filter(id_orden=id_orden).first()
    productos = Inventario.objects.filter(tipo='pt')
    datos= []
    orden = OrdenProduccion.objects.get(id_orden=id_orden)
    cliente = orden.nit.nit
    nombreCliente = orden.nit.nombre
    
    dato_cliente = Clientes.objects.get(nit=cliente)
    direccion = dato_cliente.direccion
    telefono = dato_cliente.telefono
    prioridad = transaccion.prioridad
    responsable = transaccion.responsable
    
    fecha_entrega = transaccion.fecha_entrega.strftime('%Y-%m-%d') if transaccion.fecha_entrega else None
    print('fecha',fecha_entrega)
    datos.append({ 
        'cliente': cliente,
        'nombre': nombreCliente,
        'fecha_entrega': fecha_entrega,
        'direccion': direccion,
        'telefono': telefono,
        'prioridad': prioridad,
        'responsable': responsable
        
    })
    
    return render(request, 'remontar_pedido.html',{'id_orden': id_orden, 'datos':datos, 'productos':productos})        




@transaction.atomic
def remontar_transaccion_orden(request):
    if request.method == 'POST':
        # Obtener los datos enviados desde el frontend en formato JSON
        try:
            datosEnviar = json.loads(request.body.decode('utf-8'))
            
            # Extraer los datos específicos del objeto JSON principal
            numero_factura = datosEnviar.get('numero_factura')
            fecha_actual = datosEnviar.get('fecha_actual')
            fecha_estimada_entrega = datosEnviar.get('fecha_estimada_entrega')
            id_cliente = datosEnviar.get('id_cliente')
            responsable = datosEnviar.get('responsable')
            prioridad = datosEnviar.get('prioridad')
            detallesProductos = datosEnviar.get('detallesProductos')
            
            print('orden, fecha actual, fecha estimada, cliente, responsable, prioridad', numero_factura, fecha_actual,fecha_estimada_entrega, fecha_actual,id_cliente,responsable,prioridad)
            
            # Obtener el cliente
            cliente = get_object_or_404(Clientes, nit=id_cliente)
            
            # Buscar o crear la instancia de OrdenProduccion
            orden_produccion, creado = OrdenProduccion.objects.get_or_create(
                id_orden=numero_factura,
                nit=cliente
            )
            # Primero intentamos obtener la orden con estado "en proceso" o "creado"
            orden = TransaccionOrden.objects.filter(
                id_orden=numero_factura, 
                estado__in=['en proceso', 'creado']  # Filtramos por estos estados
            ).first()

            # Si no encontramos una orden en esos estados, buscamos una en estado "facturado"
            if not orden:
                orden = TransaccionOrden.objects.filter(id_orden=numero_factura).first()
            # Iterar sobre los detalles de productos
            for detalle in detallesProductos:
                producto_id = detalle.get('producto_id')
                cantidad = detalle.get('cantidad')
                print('producto y cantidad',producto_id, cantidad)
                
                # Obtener el inventario
                inventario = get_object_or_404(Inventario, pk=producto_id)
                print('inventario', inventario.cod_inventario)
                
                
                # Verificar si ya existe una transacción con este producto en la orden de producción
                transaccion_existente = TransaccionOrden.objects.filter(
                    id_orden=orden_produccion.id_orden,
                    cod_inventario=producto_id
                    
                    
                )
                print('existente', transaccion_existente)
                
                estado_orden = orden.estado
                if transaccion_existente.exists():
                    # Verificar el estado de la transacción
                    print('la transaccion existe')
                    
                    
                    for transaccion in transaccion_existente:
                        
                        print('estado de la transaccion', transaccion.estado)
                        
                        if transaccion.estado == 'creado':
                            print('la transaccion tiene estado creado')
                            # Verificar la cantidad que se va a agregar antes de sumarla
                            cantidad_a_sumar = float(cantidad)  # Convertir a float en caso de que no sea numérico
                            cantidad_existente = float(transaccion.cantidad)
                            nueva_cantidad = cantidad_existente + cantidad_a_sumar  # Calcular la nueva cantidad
                            # Si todo es correcto, actualizamos la cantidad
                            #transaccion.cantidad = nueva_cantidad
                            print(f'Inventario actualizado para {transaccion}: nueva cantidad es {transaccion.cantidad}')
                            
                            transaccion.save()  # Guardamos la transacción con la nueva cantidad
                        elif transaccion.estado == 'en proceso':
                            print('la transaccion tiene estado en proceso')
                            
                            cantidad_a_sumar = float(cantidad)  # Convertir a float en caso de que no sea numérico
                            cantidad_existente = float(transaccion.cantidad)
                            nueva_cantidad = cantidad_existente + cantidad_a_sumar  # Calcular la nueva cantidad
                            # Si todo es correcto, actualizamos la cantidad
                            transaccion.cantidad = nueva_cantidad
                            transaccion.save()
                            # Si el estado es 'en proceso', realizar el proceso para restar las cantidades de materias primas
                            formula = Transformulas.objects.get(cod_inventario= transaccion.cod_inventario)
                            print('formula encontrada', formula.cod_inventario.cod_inventario)
                            # Restar la cantidad de materias primas
                            materias = {}

                            # Iterar para obtener las materias y cantidades
                            for i in range(1, 11):  # Dado que tienes materia1 a materia10, y cant_materia1 a cant_materia10
                                materia_field = f'materia{i}'  # Forma el nombre del campo materia1, materia2, ..., materia10
                                cant_materia_field = f'cant_materia{i}'  # Forma el nombre del campo cant_materia1, cant_materia2, ..., cant_materia10
                                
                                # Usar getattr para obtener los valores de los campos
                                materia = getattr(formula, materia_field, None)
                                cant_materia = getattr(formula, cant_materia_field, None)
                                
                                # Si la materia y su cantidad existen, los añadimos al diccionario
                                if materia and cant_materia:
                                    materias[materia] = cant_materia

                            # Ahora 'materias' tiene un diccionario con las materias y sus cantidades
                            print(materias)
                            for materia, cant_materia in materias.items():
                                try:
                                    # Verificar si 'cant_materia' es un valor numérico válido
                                    if cant_materia is not None:
                                        cant_materia = float(cant_materia)  # Convertir cant_materia a float
                                    else:
                                        raise ValueError(f"Cantidad de materia {materia} es inválida (None).")

                                    # Verificar si 'cantidad' es un valor numérico válido
                                    if cantidad is not None:
                                        cantidad = float(cantidad)  # Convertir cantidad a float
                                    else:
                                        raise ValueError(f"Cantidad recibida es inválida (None).")

                                    # Buscar la materia en el modelo Inventarios por el código
                                    inventario = Inventario.objects.get(cod_inventario=materia)
                                    
                                    # Calcular la cantidad total
                                    cantidad_total = cant_materia * float(cantidad)
                                    print('cantidad total', cantidad_total)
                                    cantidades_actuales = float(inventario.cantidad)
                                    print('cantidades actuales',cantidades_actuales)
                                    cantidad_a_guardar = cantidades_actuales-cantidad_total

                                    # Asegurarnos de que el inventario tiene la cantidad que necesitamos
                                    inventario.cantidad = cantidad_a_guardar  # Sumamos la cantidad al inventario existente
                                    #inventario.save()  # Guardamos los cambios
                                    


                                    print(f'Inventario actualizado para {materia}: nueva cantidad es {inventario.cantidad}')
                                except ValueError as ve:
                                    print(f"Error de valor: {ve}")
                                except Inventario.DoesNotExist:
                                    print(f'No se encontró la materia con el código {materia} en el inventario')
                                except Exception as e:
                                    print(f'Ocurrió un error al actualizar el inventario para {materia}: {e}')
                                            
                else:
                    # Si no existe, crear una nueva transacción
                    
                    if estado_orden == 'creado':
                        nueva_transaccion_orden = TransaccionOrden.objects.create(
                            fecha_entrega=fecha_estimada_entrega,
                            estado='creado',  # El estado inicial será 'creado'
                            cod_inventario=inventario,
                            cantidad=float(cantidad),
                            id_orden=orden_produccion,
                            prioridad=prioridad,
                            fecha_creacion=fecha_actual,
                            responsable=responsable,
                        )
                        nueva_transaccion_orden.save()
                        
                        
                    elif estado_orden == 'en proceso':
                        print(cantidad, float(cantidad))
                        
                        nueva_transaccion_orden = TransaccionOrden.objects.create(
                            fecha_entrega=fecha_estimada_entrega,
                            estado='creado',  # El estado inicial será 'creado'
                            cod_inventario=inventario,
                            cantidad=float(cantidad),
                            id_orden=orden_produccion,
                            prioridad=prioridad,
                            fecha_creacion=fecha_actual,
                            responsable=responsable,
                        )
                        nueva_transaccion_orden.save()
                        
                        print('la transaccion tiene estado en proceso')
                        # Si el estado es 'en proceso', realizar el proceso para restar las cantidades de materias primas
                        formula = Transformulas.objects.get(cod_inventario= inventario.cod_inventario)
                        print('formula encontrada', formula.cod_inventario.cod_inventario)
                        # Restar la cantidad de materias primas
                        materias = {}

                        # Iterar para obtener las materias y cantidades
                        for i in range(1, 11):  # Dado que tienes materia1 a materia10, y cant_materia1 a cant_materia10
                            materia_field = f'materia{i}'  # Forma el nombre del campo materia1, materia2, ..., materia10
                            cant_materia_field = f'cant_materia{i}'  # Forma el nombre del campo cant_materia1, cant_materia2, ..., cant_materia10
                            
                            # Usar getattr para obtener los valores de los campos
                            materia = getattr(formula, materia_field, None)
                            cant_materia = getattr(formula, cant_materia_field, None)
                            
                            # Si la materia y su cantidad existen, los añadimos al diccionario
                            if materia and cant_materia:
                                materias[materia] = cant_materia

                        # Ahora 'materias' tiene un diccionario con las materias y sus cantidades
                        print(materias)
                        for materia, cant_materia in materias.items():
                            try:
                                # Verificar si 'cant_materia' es un valor numérico válido
                                if cant_materia is not None:
                                    cant_materia = float(cant_materia)  # Convertir cant_materia a float
                                else:
                                    raise ValueError(f"Cantidad de materia {materia} es inválida (None).")

                                # Verificar si 'cantidad' es un valor numérico válido
                                if cantidad is not None:
                                    cantidad = float(cantidad)  # Convertir cantidad a float
                                else:
                                    raise ValueError(f"Cantidad recibida es inválida (None).")

                                # Buscar la materia en el modelo Inventarios por el código
                                inventario = Inventario.objects.get(cod_inventario=materia)
                                
                                # Calcular la cantidad total
                                cantidad_total = cant_materia * float(cantidad)
                                print('cantidad total', cantidad_total)
                                cantidades_actuales = float(inventario.cantidad)
                                print('cantidades actuales',cantidades_actuales)
                                cantidad_a_guardar = cantidades_actuales-cantidad_total

                                # Asegurarnos de que el inventario tiene la cantidad que necesitamos
                                inventario.cantidad = cantidad_a_guardar  # Sumamos la cantidad al inventario existente
                                inventario.save()  # Guardamos los cambios
                                

                                
                                print(f'Inventario actualizado para {materia}: nueva cantidad es {inventario.cantidad}')
                            except ValueError as ve:
                                print(f"Error de valor: {ve}")
                            except Inventario.DoesNotExist:
                                print(f'No se encontró la materia con el código {materia} en el inventario')
                            except Exception as e:
                                print(f'Ocurrió un error al actualizar el inventario para {materia}: {e}')
                                        

            
            return JsonResponse({'message': 'Transacción procesada correctamente'}, status=201)
        
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    
    return JsonResponse({'error': 'Método no permitido'}, status=405)
