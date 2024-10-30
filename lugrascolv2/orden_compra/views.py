import datetime
from django.shortcuts import render, redirect, get_object_or_404
from django.views.decorators.csrf import csrf_exempt
# Create your views here. 
from facturacion.models import  Proveedores, Compras , Inventario, TransMp
from django.http import HttpResponse, HttpResponseForbidden, JsonResponse
from django.core.exceptions import ObjectDoesNotExist
from django.utils.dateparse import parse_date
import json
from itertools import groupby
from django.db import transaction
from django.http import HttpResponseRedirect
from django.utils import timezone
from django.contrib.auth.decorators import user_passes_test
from dateutil import parser






def orden(request):
    if not (request.user.groups.filter(name="Contabilidad").exists() or not request.user.groups.filter(name="Gerencia").exists() ):
        return render(request, '403.html', status=403)
    else:
        proveedor = Proveedores.objects.all()
        estado_transaccion = TransMp.objects.all()
        return render(request, 'orden_compra.html',{"proveedor": proveedor,  "estado_transaccion": estado_transaccion})



def agregar_cantidades_precio(request):
        if request.method == 'POST':
            
            try:
                datos_tabla = json.loads(request.body.decode('utf-8')).get('datos_tabla')
                total = json.loads(request.body.decode('utf-8')).get('totalFactura')
                if datos_tabla:
                    for datos in datos_tabla:
                        id_producto = datos['idProducto']
                        inventario = Inventario.objects.get(pk=id_producto)
                        nombre = datos['nombreProducto']
                        cantidad_nueva = int(datos['cantidad'])  # Convertir a número si es necesario
                        precio_unitario = float(datos['precioUnitario'])  # Convertir a número si es necesario
                        fecha_creacion = datos['fechaCreacion']
                        total_linea = datos['totalFila']
                        unidad = datos['valorUnidad']
                        proveedor = datos['idProveedor']
                        factura = datos['factura']
                        recibir = datos['recibido']
                        tipo = 'm'
                    
                        
                        
                        compra, _ = Compras.objects.get_or_create(id_compra=factura, defaults={'id_compra': factura, 'total_factura': total, 'estado':recibir})
                        nueva_materia_prima = TransMp.objects.create(
                        cod_inventario = inventario,    
                        nombre_mp=nombre,
                        cant_mp=cantidad_nueva,
                        id_proveedor= proveedor,  # Asumiendo que `id_proveedor` es el campo ForeignKey  # Asumiendo que `fecha_ingreso` es el campo DateField
                        costo_unitario=precio_unitario,
                        fecha_ingreso = fecha_creacion,
                        id_compra = compra,
                        total_linea = total_linea,
                        unidad_medida = unidad,
                        tipo = tipo
                        )
                        nueva_materia_prima.save();
                        # Aquí puedes procesar y guardar los datos adicionales si es necesario
                        
                return JsonResponse({'success': True, 'message': 'Datos actualizados correctamente'})
            except Exception as e:
                return JsonResponse({'success': False, 'error': str(e)}, status=400)
        else:
            return JsonResponse({'success': False, 'error': 'Método de solicitud no permitido'}, status=405)
        
def obtener_productos(request):
    proveedor_id = request.GET.get('proveedor_id')  # Obtener el ID del proveedor desde los parámetros GET
    if proveedor_id:
            # Filtrar productos por ID del proveedor
            productos = Inventario.objects.filter(id_proveedor=proveedor_id)
            # Construir lista de datos para los productos encontrados
            data = [{'id': producto.cod_inventario, 'nombre': producto.nombre, 'proveedor_id': producto.id_proveedor.id_proveedor} for producto in productos]
            return JsonResponse(data, safe=False)
    else:
            return JsonResponse({'error': 'No se proporcionó un ID de proveedor válido'}, status=400)
        
        
def mostrar_datos(request):
        datos_tabla = request.GET.get('datos_tabla')
        total_tabla = request.GET.get('total_tabla')
        return render(request, 'mostrar_datos.html', {'datos_tabla': datos_tabla, 'total_tabla': total_tabla})
    
    
    
    
def compras(request):
    # Obtener todas las transacciones ordenadas por id_compra y fecha_ingreso
    transacciones = TransMp.objects.order_by('id_compra', 'fecha_ingreso')

    # Agrupar transacciones por id_compra
    transacciones_agrupadas = {key: list(group) for key, group in groupby(transacciones, key=lambda x: x.id_compra_id)}

    # Crear lista para almacenar los datos de la tabla
    datos_tabla = []

    # Iterar sobre las transacciones agrupadas
    for id_compra, transacciones_grupo in transacciones_agrupadas.items():
        # Obtener el total de la factura sumando los total_linea de las transacciones
        total_factura = sum(transaccion.total_linea for transaccion in transacciones_grupo)

        # Obtener la fecha de ingreso de la primera transacción
        fecha_ingreso = transacciones_grupo[0].fecha_ingreso
        
        compra = Compras.objects.get(id_compra=id_compra)

        # Agregar los datos a la lista de la tabla
        datos_tabla.append({'id_compra': id_compra, 'total_factura': total_factura, 'fecha_ingreso': fecha_ingreso, 'compra': compra})

    # Pasar los datos de la tabla al contexto
    context = {'datos_tabla': datos_tabla}
    
    return render(request, 'compras.html', context)


def verOrden(request, id_compra):
    try:
        # Consultar los elementos relacionados a la orden
        elementos = TransMp.objects.filter(id_compra=id_compra)

        # Crear una lista de diccionarios con los datos de los elementos
        elementos_list = []
        for elemento in elementos:
            cod_inventario = elemento.cod_inventario.cod_inventario if elemento.cod_inventario else None
            elemento_data = {
                'cod_inventario': cod_inventario,
                'nombre_mp': elemento.nombre_mp,
                'cant_mp': elemento.cant_mp,
                'costo_unitario': elemento.costo_unitario,
                # Agrega más campos según sea necesario
            }
            elementos_list.append(elemento_data)
            


        # Devolver los datos como una respuesta JSON
        return JsonResponse({'elementos': elementos_list})

    except Exception as e:
        # Manejar cualquier error y devolver una respuesta de error
        return JsonResponse({'error': str(e)}, status=500)
    
    
    
def actualizar_inventario(request, id_compra):
    try:
        # Consultar los elementos relacionados a la orden
        elementos = TransMp.objects.filter(id_compra=id_compra)
        

        # Crear una lista de diccionarios con los datos de los elementos
        elementos_list = []
        for elemento in elementos:
            
            cod_inventario = elemento.cod_inventario.cod_inventario if elemento.cod_inventario else None
            elemento_data = {
                'cod_inventario': cod_inventario,
                'nombre_mp': elemento.nombre_mp,
                'cant_mp': elemento.cant_mp,
                'costo_unitario': elemento.costo_unitario,
                # Agrega más campos según sea necesario
            }
            elementos_list.append(elemento_data)
            
            
            
        # Actualizar el inventario para los productos asociados a la orden
        actualizar_inventario_orden(id_compra)
            


        # Devolver los datos como una respuesta JSON
        return JsonResponse({'elementos': elementos_list})

    except Exception as e:
        # Manejar cualquier error y devolver una respuesta de error
        return JsonResponse({'error': str(e)}, status=500)
    
    
    
    
    
    
def actualizar_inventario_orden(id_compra):
    try:
        # Iniciar una transacción para garantizar la integridad de los datos
        with transaction.atomic():
            # Consultar los elementos relacionados a la orden
            elementos = TransMp.objects.filter(id_compra=id_compra)

            # Iterar sobre los elementos y actualizar el inventario
            for elemento in elementos:
                # Por ejemplo, asignando 'm' como tipo por defecto
                
                producto = elemento.cod_inventario
                cantidad_actual = producto.cantidad
                cantidad_orden = elemento.cant_mp

                # Actualizar la cantidad en inventario sumando la cantidad de la orden
                producto.cantidad = cantidad_actual + cantidad_orden
                producto.save()  # Guardar los cambios en la base de datos

        # La actualización se realizó correctamente
        return True

    except Exception as e:
        # Manejar cualquier error y devolver False para indicar que la actualización falló
        print(f"Error al actualizar inventario: {str(e)}")
        return False    
    
    
@csrf_exempt   
def actualizar_estado_compra(request, id_compra):
    try:
        # Verificar que la solicitud sea POST
        if request.method == 'POST':
            # Obtener el estado enviado en la solicitud
            estado_str = request.POST.get('estado')

            # Convertir la cadena de estado a un valor booleano
            if estado_str.lower() == 'true':
                estado = True
            elif estado_str.lower() == 'false':
                estado = False
            else:
                raise ValueError('El estado debe ser "true" o "false"')

            # Obtener la compra correspondiente al ID dado
            compra = Compras.objects.get(id_compra=id_compra)

            # Actualizar el estado de la compra
            compra.estado = estado
            compra.save()

            # Devolver una respuesta exitosa
            return JsonResponse({'message': 'Estado de compra actualizado correctamente'}, status=200)

        else:
            # Si no es una solicitud POST, devolver un error
            return JsonResponse({'error': 'Solicitud no válida'}, status=400)

    except Compras.DoesNotExist:
        # Manejar el caso en el que no se encuentre ninguna compra con el ID dado
        return JsonResponse({'error': 'No se encontró ninguna compra con el ID proporcionado'}, status=404)

    except ValueError as e:
        # Manejar el error si el estado no es válido
        return JsonResponse({'error': str(e)}, status=400)

    except Exception as e:
        # Manejar cualquier otro error y devolver un mensaje de error
        return JsonResponse({'error': str(e)}, status=500)
    

def agregar_proveedor(request):
    if request.method == 'POST':
        nit = request.POST.get('nit')
        nombre = request.POST.get('name')
        direccion = request.POST.get('direccion')
        telefono = request.POST.get('telefono')

        # Verificar si ya existe un proveedor con el mismo NIT
        if Proveedores.objects.filter(id_proveedor=nit).exists():
            # Mostrar una alerta indicando que el proveedor ya existe
            return render(request, 'orden_compra.html', {'proveedor_existente': True})

        # Crear una nueva instancia del modelo Proveedor y guardarla en la base de datos
        nuevo_proveedor = Proveedores(id_proveedor=nit, nombre_proveedor=nombre, direccion=direccion, telefono=telefono)
        nuevo_proveedor.save()

        # Devolver al usuario a la URL anterior
        previous_url = request.META.get('HTTP_REFERER')
        return redirect(previous_url)

    return render(request, 'orden_compra.html')

def guardar_producto(request):
    if request.method == 'POST':
        # Obtener los datos del formulario
        id_producto = request.POST.get('identificador')
        nombre = request.POST.get('nombre')
        nit_proveedor = request.POST.get('provee')
        tipo = 'm'
        
                # Verificar si el proveedor existe en la base de datos
        proveedor = Proveedores.objects.filter(id_proveedor=nit_proveedor).first()
        if not proveedor:
            # Manejar el caso en el que el proveedor no existe
            return HttpResponse("El proveedor no existe en la base de datos.")
        

        # Guardar los datos en el modelo TransMp
        nuevo_producto = Inventario(
            nombre=nombre,
            cantidad=0,
            id_proveedor=proveedor,
            cod_inventario= id_producto,
            tipo = tipo
        )
        nuevo_producto.save()

        # Devolver al usuario a la URL anterior
        previous_url = request.META.get('HTTP_REFERER')
        return redirect(previous_url)
    
    # Si no es una solicitud POST, renderizar el formulario nuevamente
    return render(request, 'nombre_template.html')



def edita_orden_compra(request, numero_compra):
    # Recuperar todas las transacciones asociadas a la compra
    transacciones = TransMp.objects.filter(id_compra=numero_compra)
    primer_objeto = transacciones[0]
    Proveedor = Proveedores.objects.get(id_proveedor=primer_objeto.id_proveedor)
    proveedorId= Proveedor.id_proveedor
    nombreProveedor= Proveedor.nombre_proveedor
    print('proveedor', proveedorId)

    
        # Acceder al nombre del proveedor a través de la relación con la llave foránea
    
        
    for objeto in transacciones:
        
        objeto.fecha_ingreso_str = objeto.fecha_ingreso.strftime('%Y-%m-%d')
        
        
        objeto.direccion = Proveedor.direccion
        objeto.telefono = Proveedor.telefono
        costo_unitario = objeto.costo_unitario
        objeto.costo_unitario = costo_unitario
    
    return render(request, 'editar_compra.html' ,{'objetos': transacciones, 'proveedores': proveedorId, 'nombres':nombreProveedor})


def obtener(request):
    proveedor_id = request.GET.get('proveedor_id')  # Obtener el ID del proveedor desde los parámetros GET
    if proveedor_id:
            # Filtrar productos por ID del proveedor
        productos = Inventario.objects.filter(id_proveedor=proveedor_id)
        producto = TransMp.objects.filter(id_proveedor=proveedor_id)
        # Obtener el último precio unitario del producto seleccionado desde TransMp
        ultimo_transaccion = TransMp.objects.filter(id_proveedor=proveedor_id).order_by('-fecha').first()
        if ultimo_transaccion:
            precio_unitario = ultimo_transaccion.precio_unitario
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
    
    



def actualizarTMP(request):
    if request.method == 'POST' and request.headers.get('x-requested-with') == 'XMLHttpRequest':
        # Obtener los datos enviados desde el frontend
        # Aquí asumimos que los datos se envían como JSON desde el frontend
        

        # Procesar los datos recibidos
        try:
            data = json.loads(request.body.decode('utf-8'))
            nfactura = data.get('nfactura')
            total_factura= data.get('total')
            datos_filas = data.get('datos')
            recibir = False
            print('factura', 'total', nfactura, total_factura)
            
            
            proveedor = datos_filas[0]
            
            idproveedor = proveedor.get('idProveedor')
            fecha = proveedor.get('fechaIngreso').replace('.', '')
            print(fecha)
            
            fechaobj = parser.parse(fecha)
            print(fechaobj)
            fechasolo = fechaobj.date()
            print(fechasolo)
            TransMp.objects.filter(id_compra=nfactura).delete()
            Compras.objects.get(id_compra=nfactura).delete()
            

            
            for objeto in datos_filas:
                idproducto= objeto['codInventario']
                cantidad = objeto['cantidad']
                costo = objeto['costo']
                total_linea = objeto['totalLinea']

        
                unidadM = objeto['unidadMedida']
                idProveedor = objeto['idProveedor']
                idCompra = objeto['idCompra']
                tipo = objeto['tipo']
                try:

                    
                    compra, _ = Compras.objects.get_or_create(id_compra=idCompra, defaults={'total_factura': total_factura, 'estado':recibir})
                    inventario = Inventario.objects.get(pk=idproducto)
                    nombre = inventario.nombre
                    
                    print('Creando nuevo elemento con cod_inventario:', inventario.cod_inventario)
                    
                    # Crear una nueva instancia de TransMp
                    nuevo_elemento = TransMp.objects.create(
                        cod_inventario=inventario,
                        nombre_mp=nombre,
                        cant_mp=cantidad,
                        costo_unitario=costo,
                        total_linea= total_linea,
                        fecha_ingreso= fechasolo,
                        unidad_medida= unidadM,
                        id_proveedor=idProveedor,  # Asegúrate de usar el ID correcto
                        id_compra=compra,  # Asignar la instancia de compra
                        tipo= tipo
                    )
                    nuevo_elemento.save()
                    
                    print('Elemento guardado:', nuevo_elemento)
                    
                except Proveedores.DoesNotExist:
                    print(f'Error: Proveedor con ID {objeto["idProveedor"]} no encontrado.')
                    return JsonResponse({'error': f'Proveedor no encontrado: {objeto["idProveedor"]}'}, status=400)
                except Inventario.DoesNotExist:
                    print(f'Error: Inventario con código {objeto["codInventario"]} no encontrado.')
                    return JsonResponse({'error': f'Inventario no encontrado: {objeto["codInventario"]}'}, status=400)

                
            
                
            
            # Si todo sale bien, puedes devolver una respuesta JSON con un mensaje de éxito
            return JsonResponse({'message': 'Datos actualizados correctamente.'}, status=200)

        except Exception as e:
            # Manejar cualquier excepción que pueda ocurrir durante el procesamiento de los datos
            return JsonResponse({'error': str(e)}, status=400)

    # Si la petición no es AJAX o no es POST, puedes devolver un error
    return JsonResponse({'error': 'Método no permitido'}, status=405)



def eliminarOrden(request, id_compra):
    # Obtener la compra por id_compra
    compra = get_object_or_404(Compras, id_compra=id_compra)
    
    if request.method == 'POST':
        # Eliminar todos los registros relacionados en TransMP
        transmps = TransMp.objects.filter(id_compra=compra)
        transmps.delete()
        
        # Eliminar la compra
        compra.delete()
        
        # Redirigir a alguna página de éxito o a donde corresponda
        return redirect('compras')  # Ajusta esto a la URL a la que deseas redirigir después de eliminar
    
    # Si se accede a través de un método GET u otro método, puedes manejarlo aquí
    # o redirigir a otra página de error o de confirmación.
    
    # Por ejemplo, puedes mostrar un mensaje de confirmación o simplemente redirigir a la página anterior.
    return redirect('compras') 