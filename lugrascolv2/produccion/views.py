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

            # Verificar si ya existe un proveedor con el mismo NIT
            if Clientes.objects.filter(nit=nit).exists():
                # Mostrar una alerta indicando que el proveedor ya existe
                return render(request, 'orden_compra.html', {'clientes_existente': True})

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
                    cantidad=cantidad,
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
        detalles = TransaccionOrden.objects.filter(id_orden = id_orden)

        
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
        inventario.cantidad -= cantidad_requerida
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
        print('fecha actual:' , fechaActual)

        try:
            # Filtrar las transacciones relacionadas con la orden
            transacciones = TransaccionOrden.objects.filter(id_orden=idOrden)

            # Iterar sobre las transacciones y actualizar el estado
            for transaccion in transacciones:
                transaccion.estado = estado
                transaccion.fecha_terminacion_orden = fechaActual
                transaccion.save()
                

                # Obtener el cod_inventario y cantidad de la transacción
                cod_inventario = transaccion.cod_inventario.cod_inventario
                cantidad = transaccion.cantidad

                # Actualizar el inventario correspondiente
                inventario = get_object_or_404(Inventario, cod_inventario=cod_inventario)
                inventario.cantidad += cantidad
                inventario.save()

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
                producto_obj = transaccion.get(cod_inventario__cod_inventario=cod_inventario)
                
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
        
        transacciones= TransaccionOrden.objects.filter(id_orden=id_orden)
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
        