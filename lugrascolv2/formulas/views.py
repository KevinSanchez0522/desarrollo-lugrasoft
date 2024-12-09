import json
from django.shortcuts import get_object_or_404, render
from facturacion.models import Inventario, TransMp, Transformulas, Proveedores, TransaccionOrden
from django.http import JsonResponse, HttpResponseBadRequest
from django.views.decorators.csrf import csrf_exempt
from django.core.exceptions import ObjectDoesNotExist 
from django.core.paginator import Paginator

# Create your views here.

def verFormula(request):
    
    # Obtener todos los productos para renderizar el formulario
    
    productos = Inventario.objects.all()
    
    # Inicializar el precio unitario como None por defecto
    precio_unitario = None
    
    if request.method == 'POST':
        # Obtener el producto seleccionado del formulario
        cod_producto = request.POST.get('cod_producto')
        
        # Obtener el último precio unitario del producto seleccionado desde TransMp
        ultimo_transaccion = TransMp.objects.filter(cod_producto=cod_producto).order_by('-fecha').first()
        if ultimo_transaccion:
            precio_unitario = ultimo_transaccion.precio_unitario
        else:
            # Si no hay transacciones, establecer un precio predeterminado
            precio_unitario = 0
        
        # Obtener el producto desde Inventario
        producto = Inventario.objects.get(cod_producto=cod_producto)
        
        # Agregar el producto a la tabla (aquí debes implementar la lógica para agregarlo a la tabla)


    
    # Pasar el precio unitario como parte del contexto
    contexto = {'productos': productos, 'precio_unitario': precio_unitario}
    
    return render(request, 'formulas.html', contexto)



@csrf_exempt
def vertabla(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        codigo = data.get('cod_inventario')

        try:
            # Intentar obtener el producto desde Inventario
            producto = Inventario.objects.get(cod_inventario=codigo)
            # Obtener el último precio unitario del producto seleccionado desde TransMp
            ultimo_transaccion = TransMp.objects.filter(cod_inventario=codigo).order_by('-fecha_ingreso').first()
            precio_unitario = ultimo_transaccion.costo_unitario if ultimo_transaccion else 0

            datos_producto = {
                'cod_producto': producto.cod_inventario,
                'nombre': producto.nombre,
                'cantidad': '',  # Puedes obtener la cantidad desde alguna otra fuente si es necesario
                'precio_unitario': precio_unitario
            }

            return JsonResponse(datos_producto)
        except ObjectDoesNotExist:
            return JsonResponse({'error': 'Producto no encontrado'}, status=404)
    else:
        return HttpResponseBadRequest('Método no permitido')


def guardar_datos(request):
    if request.method == 'POST':
        tabla_data_raw = request.POST.get('tablaData')
        tabla_data = json.loads(tabla_data_raw) if tabla_data_raw else []
        
        # Obtener los datos del formulario
        nombre = request.POST.get('nombre')
        codig = int(request.POST.get('codig'))  # Se supone que este es el cod_inventario
        cantidad = float(0)
        id_proveedor = 901452546
        nombre_proveedor = 'LUGRASCOL S.A.S'
        direccion_proveedor = 'KM 2 VDA LAGUNETAS FINCA LOS DOMINGUEZ'
        telefono = '3192404446'
        tipo ='pt'
        
        
        proveedor, created = Proveedores.objects.get_or_create(
            id_proveedor= id_proveedor,
            defaults={'id_proveedor': id_proveedor, 'nombre_proveedor': nombre_proveedor, 'direccion':direccion_proveedor, 'telefono': telefono }
        )
        
        
        # Verificar si el inventario ya existe o crear uno nuevo
        inventario, created = Inventario.objects.get_or_create(
            cod_inventario=codig,
            defaults={'nombre': nombre, 'cantidad':cantidad , 'id_proveedor': proveedor, 'tipo': tipo }
        )

        # Crear la instancia de Transformulas con datos básicos
        transformula = Transformulas(
            nombre=nombre,
            cod_inventario=inventario,
            porcentajeiva=float(request.POST.get('V_Iva')),
            pocentajeutilidad=float(request.POST.get('Utilidad')),
            costosindirectos=float(request.POST.get('costinderec')),
            peso= float(request.POST.get('Peso'))
            
            
        )

        # Asignar materiales desde tabla_data
        materiales = [f'materia{i+1}' for i in range(10)]
        cantidades = [f'cant_materia{i+1}' for i in range(10)]

        # Procesar los elementos de tabla_data que contienen datos válidos
        for index, item in enumerate(tabla_data):
            if index < 10 and item.get('cod_producto') and item.get('cantidad'):
                try:
                    cod_producto = int(item['cod_producto'])
                    cantidad = float(item['cantidad'])

                    setattr(transformula, materiales[index], cod_producto)
                    setattr(transformula, cantidades[index], cantidad)
                    
                except (ValueError, TypeError):
                    print(f"Error al procesar el material en la posición {index+1}")
                    continue

        transformula.save()

        return JsonResponse({'message': 'Datos guardados correctamente'}, status=200)

    return JsonResponse({'error': 'Método no permitido'}, status=405)


def verformulas (request):
    if not (request.user.groups.filter(name="Contabilidad").exists() or request.user.groups.filter(name="Gerencia").exists()):
        return render(request, '403.html', status=403)
    else:
        formulas = Transformulas.objects.all()

        for formula in formulas:
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
                        
            
            iva_costo = (subtotal_costo * formula.porcentajeiva)/100            
            total_costo = subtotal_costo + formula.costosindirectos + iva_costo
            utilidad_bruta = ((subtotal_costo + formula.costosindirectos)*formula.pocentajeutilidad)/100
            subtotal_venta = subtotal_costo + formula.costosindirectos + utilidad_bruta
            total_venta = subtotal_venta + (subtotal_venta*19)/100
            
            
            

            formula.subtotal_costo = round(subtotal_costo, 2)
            formula.total_costo = round(total_costo, 2)
            formula.subtotal_venta = round(subtotal_venta, 2)
            formula.total_venta = round(total_venta, 2)
            formula.iva_costo = round(iva_costo, 2)
            formula.utilidad_bruta = round(utilidad_bruta,2)

    
    return render(request, 'verformula1.html', {'formulas': formulas})




    
def actualizar_transformula(request):
    if request.method == 'POST':
        # Obtener los datos del cuerpo de la solicitud POST
        data = json.loads(request.body)

        # Obtener el ID de la transformula y el resto de los datos
        transformula_id = data.get('transformulasId')
        print(transformula_id)
        costos_indirectos = data.get('costosIndirectos')
        print(costos_indirectos)
        utilidad = data.get('utilidad')
        iva = data.get('iva')
        cantidades = data.get('cantidades',[])
        nombre = data.get('nombre')


        # Buscar la transformula correspondiente en la base de datos
        try:
            transformula = Transformulas.objects.get(cod_inventario=transformula_id)
            
            # Actualizar los campos del objeto Transformulas
            transformula.costosindirectos = costos_indirectos
            transformula.pocentajeutilidad = utilidad
            transformula.porcentajeiva = iva
            transformula.nombre = nombre

            # Actualizar los campos de materia y cantidad
            for i, cantidad in enumerate(cantidades, start=1):
                setattr(transformula, f'cant_materia{i}', cantidad)

            # Guardar los cambios en la base de datos
            transformula.save()

            # Devolver una respuesta JSON
            return JsonResponse({'status': 'success', 'message': 'Datos actualizados correctamente'})
        except Transformulas.DoesNotExist:
            # Manejar el caso donde no se encuentra una transformula con el ID dado
            return JsonResponse({'status': 'error', 'message': 'Transformula no encontrada'})
    else:
        # Devolver una respuesta de error si la solicitud no es POST
        return JsonResponse({'status': 'error', 'message': 'Método no permitido'})    
    
    
    
    
    
def eliminarFormula(request, cod_inventario):
    
    producto = get_object_or_404(Inventario, cod_inventario=cod_inventario)
    orden= get_object_or_404(TransaccionOrden,cod_inventario=cod_inventario)
    
    if producto.cantidad > 0:
        # Si el producto tiene cantidades en inventario, devolver un mensaje de error
        return JsonResponse({'mensaje': f'No se puede eliminar el producto {cod_inventario} porque tiene cantidades en inventario.'}, status=400)
    if orden.cod_inventario:
        # Si el producto tiene cantidades en inventario, devolver un mensaje de error
        return JsonResponse({'mensaje': f'No se puede eliminar el producto {cod_inventario} porque esta en proceso de produccion.'}, status=400)
    else:
        # Si el producto no tiene cantidades en inventario, proceder con la eliminación
        transaccion = get_object_or_404(Transformulas, cod_inventario=cod_inventario)
        transaccion.delete()
        producto.delete()
        return JsonResponse({'mensaje': f'Producto {cod_inventario} eliminado correctamente.'}, status=200)
    
    
    
    
    
def editar_formula(request, cod_inventario):
    producto = Inventario.objects.all()
    # Obtener la fórmula que quieres editar
    formula = get_object_or_404(Transformulas, cod_inventario=cod_inventario)
    print('Código de la fórmula:', formula.cod_inventario)
    
    # Obtener las materias primas asociadas (solo las que no son None)
    materias_primas = []
    for i in range(1, 11):
        materia_field = getattr(formula, f'materia{i}')
        cantidad_field = getattr(formula, f'cant_materia{i}')
        
        if materia_field:
            # Obtener la materia prima del modelo Inventario
            materia = get_object_or_404(Inventario, cod_inventario=materia_field)
            
            # Obtener el último precio de compra de esta materia
            ultimo_precio_compra = TransMp.objects.filter(cod_inventario=materia).order_by('-fecha_ingreso').first()

            # Si no hay compras previas, puedes asignar un precio predeterminado o None
            precio_compra = ultimo_precio_compra.costo_unitario if ultimo_precio_compra else None
            
            # Agregar los datos de la materia prima a la lista
            materias_primas.append({
                'materia': materia,
                'cantidad': cantidad_field,
                'precio_compra': precio_compra
            })
    
    # Pasa las materias primas a la plantilla
    return render(request, 'editarFormula.html', {
        'formula': formula,
        'materias_primas': materias_primas,
        'productos': producto
    })
    
def update_transformula(request):   
    if request.method == 'POST':
        # Obtener los datos del cuerpo de la solicitud POST
        data = json.loads(request.body)
        print("Cuerpo de la solicitud:", request.body)

        # Obtener el ID de la transformula y el resto de los datos
        transformula_id = data.get('codig')  # Aquí usamos 'transformulasId' como en el frontend
        print(transformula_id)
        costos_indirectos = data.get('costos_indirectos')  # Asegurándonos de que coincida con el nombre
        print(costos_indirectos)
        utilidad = data.get('utilidad')
        print(utilidad)
        iva = data.get('iva')
        print(iva)
        cantidades = data.get('materias_primas', [])  # Lista de las materias primas con cantidades
        print(cantidades)
        nombre = data.get('nombre')
        print(nombre)
        peso = data.get('peso')
        print(peso)
        
                # Imprimir las cantidades y los productos (materias primas)



        # Buscar la transformula correspondiente en la base de datos
        try:
            transformula = Transformulas.objects.get(cod_inventario=transformula_id)
            inventario = Inventario.objects.get(cod_inventario=transformula_id)
            
            # Actualizar los campos del objeto Transformulas
            transformula.costosindirectos = costos_indirectos
            transformula.pocentajeutilidad = utilidad
            transformula.porcentajeiva = iva
            transformula.nombre = nombre
            transformula.peso = peso
            inventario.nombre= nombre
            inventario.save()


            for i in range(1, 11):  # Asumiendo que el máximo número de materias es 5
                setattr(transformula, f'materia{i}', None)
                setattr(transformula, f'cant_materia{i}', None)
            
            # Actualizar los campos de materia y cantidad
            for i, materia_data in enumerate(cantidades, start=1):
                cod_inventario = materia_data.get('cod_inventario')
                cantidad = float(materia_data.get('cantidad', 0))
                print('codigo, cantidad', cod_inventario, cantidad)
                try:
                    # Obtener la materia prima
                    materia = Inventario.objects.get(cod_inventario=cod_inventario)

                    # Verificar si la materia existe (si no lanza la excepción se procesará)
                    setattr(transformula, f'materia{i}', materia.cod_inventario)
                    setattr(transformula, f'cant_materia{i}', cantidad)

                except Inventario.DoesNotExist:
                    print(f"Materia prima con código {cod_inventario} no encontrada")
            # Guardar los cambios en la base de datos
            transformula.save()

            # Devolver una respuesta JSON
            return JsonResponse({'status': 'success', 'message': 'Datos actualizados correctamente'})
        except Transformulas.DoesNotExist:
            # Manejar el caso donde no se encuentra una transformula con el ID dado
            return JsonResponse({'status': 'error', 'message': 'Transformula no encontrada'})
        except Inventario.DoesNotExist:
            # Manejar el caso donde no se encuentra alguna materia prima
            return JsonResponse({'status': 'error', 'message': 'Una o más materias primas no existen'})
    else:
        # Devolver una respuesta de error si la solicitud no es POST
        return JsonResponse({'status': 'error', 'message': 'Método no permitido'})
    
    
    
    
    
