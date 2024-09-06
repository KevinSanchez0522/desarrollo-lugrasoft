import json,io
import random
from django.http import HttpResponse, HttpResponseBadRequest, JsonResponse,FileResponse
from django.shortcuts import get_object_or_404, render, redirect
from facturacion.models import  Inventario, TransaccionAjuste, Ajustes, Averias, TransaccionAverias, TransMp, Transformulas
from django.db.models import Max, F
from docx import Document
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Table, TableStyle, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from decimal import Decimal


#Create your views here.

# Create your views here.


def inventory_view(request):
    inventario = Inventario.objects.all()
    return render(request, 'inventario.html', {"inventario" : inventario} )



def ajuste(request):
    producto = Inventario.objects.all()
    return render(request, 'ajuste_inventario.html', {'productos': producto})

def agregar_transaccion_ajuste(request):
        if request.method == 'POST':
            
            try:
                datos_tabla = json.loads(request.body.decode('utf-8')).get('datos_tabla')
                if datos_tabla:
                    for datos in datos_tabla:
                        codigo = datos['codigo']
                        descripcion = datos['descripcion']
                        fecha_ajuste = datos['fecha']
                        producto = datos['id_producto']
                        cantidad = datos['cantidad']
                    
                        
                        ajusteN, _ = Ajustes.objects.get_or_create(id_ajuste = codigo)
                        inventario, _ = Inventario.objects.get_or_create(cod_inventario= producto)
                        nueva_cantidad = F('cantidad') + cantidad
                        
                        nuevo_ajuste = TransaccionAjuste.objects.create(
                        fecha_ajuste = fecha_ajuste,
                        cant_ajuste = cantidad,
                        descripcion = descripcion,
                        id_ajuste = ajusteN,
                        cod_inventario = inventario
                        )
                        nuevo_ajuste.save();
                        # Aquí puedes procesar y guardar los datos adicionales si es necesario
                        Inventario.objects.filter(cod_inventario=producto).update(cantidad=nueva_cantidad)
                        
                return JsonResponse({'success': True, 'message': 'Datos actualizados correctamente'})
            except Exception as e:
                return JsonResponse({'success': False, 'error': str(e)}, status=400)
        else:
            return JsonResponse({'success': False, 'error': 'Método de solicitud no permitido'}, status=405)
        
        
        

def obtener_numero_ajuste(request):
    ultimo_ajuste = None  # Define la variable antes del bloque try
    
    try:
        ultimo_ajuste = Ajustes.objects.aggregate(Max('id_ajuste'))['id_ajuste__max']
        print(ultimo_ajuste)
        if ultimo_ajuste is not None:
            nuevo_ajuste = ultimo_ajuste + 1
        else:
            nuevo_ajuste = 10001
            print(nuevo_ajuste)
    except Exception as e:
        print(f"Error al obtener o generar el número de ajuste: {e}")
        nuevo_ajuste = None

    data = {'numero_ajuste': nuevo_ajuste, 'ultimo_ajuste': ultimo_ajuste}
    return JsonResponse(data)


def ver_ajuste (request):
    transaccion = TransaccionAjuste.objects.all()
    return  render(request, 'ajuste_inventario.html',{'transacciones': transaccion})



def agregar_transaccion_averias(request):
        if request.method == 'POST':
            
            try:
                datos_tabla = json.loads(request.body.decode('utf-8')).get('datos_tabla')
                if datos_tabla:
                    # Generar el documento de Word
                    document = Document()
                    document.add_heading('Transacciones de Averías', level=1)
                    for datos in datos_tabla:
                        codigo = datos['codigo']
                        fecha_ajuste = datos['fecha']
                        producto = datos['id_producto']
                        cantidad = datos['cantidad']
                        
                    
                        
                        averiaN, _ = Averias.objects.get_or_create(id_averia = codigo)
                        inventario, _ = Inventario.objects.get_or_create(cod_inventario= producto)
                        nueva_cantidad = F('cantidad') - cantidad
                        
                        nuevo_averia = TransaccionAverias.objects.create(
                        fecha_averia = fecha_ajuste,
                        cant_averia = cantidad,
                        id_averia = averiaN,
                        cod_inventario = inventario
                        )
                        nuevo_averia.save();
                        # Aquí puedes procesar y guardar los datos adicionales si es necesario
                        Inventario.objects.filter(cod_inventario=producto).update(cantidad=nueva_cantidad)
                    
                return JsonResponse({'success': True, 'message': 'Datos actualizados correctamente'})
            except Exception as e:
                return JsonResponse({'success': False, 'error': str(e)}, status=400)
        else:
            return JsonResponse({'success': False, 'error': 'Método de solicitud no permitido'}, status=405)
        
        
        
def obtener_numero_averia(request):
    ultima_averia = None  # Define la variable antes del bloque try
    
    try:
        ultima_averia = Averias.objects.aggregate(Max('id_averia'))['id_averia__max']
        print(ultima_averia)
        if ultima_averia is not None:
            nueva_averia = ultima_averia + 1
        else:
            nueva_averia = 20001
            print(nueva_averia)
    except Exception as e:
        print(f"Error al obtener o generar el número de ajuste: {e}")
        nueva_averia = None

    data = {'numero_ajuste': nueva_averia, 'ultimo_ajuste': ultima_averia}
    return JsonResponse(data)

def averias(request):
    producto = Inventario.objects.all()
    return render(request, 'control_averias.html', {'productos': producto})



def generar_informe_averia(request):
    
    if request.method == 'GET':
        id_averia = request.GET.get('id_averia')
    elif request.method == 'POST':
        id_averia = request.POST.get('id_averia')
    else:
        # En este ejemplo, no manejamos otras solicitudes HTTP, como PUT o DELETE
        return HttpResponseBadRequest("Método HTTP no permitido")

    # Obtener las transacciones de averías asociadas a la avería
    transacciones = TransaccionAverias.objects.filter(id_averia=id_averia)

    # Obtener la fecha de la avería (suponiendo que todas las transacciones tienen la misma fecha)
    primera_transaccion = transacciones.first()  # Tomamos la primera transacción como representativa
    fecha_averia = primera_transaccion.fecha_averia if primera_transaccion else "Fecha no disponible"

    # Crear un documento PDF
    pdf_buffer = io.BytesIO()
    pdf = SimpleDocTemplate(pdf_buffer, pagesize=letter)

    # Estilos para el documento
    styles = getSampleStyleSheet()

    # Contenido del documento
    content = []

    # Título y fecha de la avería
    content.append(Paragraph(f"Informe de Avería #{id_averia}", styles['Title']))
    content.append(Spacer(1, 30)) 

    content.append(Paragraph(f"Fecha de Avería: {fecha_averia}", styles['Normal']))
    
    content.append(Spacer(1, 30))  

    # Detalles de las transacciones en forma de tabla
    data = [['Código de Inventario', 'Nombre', 'Cantidad', 'Costo']]
    totalCosto = Decimal('0.00')
    
    for transaccion in transacciones:
        
        formula = Transformulas.objects.filter(
                cod_inventario=transaccion.cod_inventario
        ).first()
            
        if formula:
            # Si el código del producto es una fórmula, calcular el costo usando la fórmula
            subtotal_costo = 0.0
            iva_costo = 0.0
            total_costo = 0.0
            
            # Calcular el subtotal_costo usando las materias primas de la fórmula
            for i in range(1, 9):  # Iterar sobre los campos materia1 hasta materia8
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
            
            iva_costo = (Decimal(subtotal_costo) * Decimal(formula.porcentajeiva)) / Decimal('100')
            total_costo = Decimal(subtotal_costo) + Decimal(formula.costosindirectos) + iva_costo
            precio_unitario = total_costo
            
        else:
            # Si el código del producto es una materia prima, obtener el costo unitario de la última transacción
            ultimo_transaccion = TransMp.objects.filter(
                cod_inventario=transaccion.cod_inventario
            ).order_by('-fecha_ingreso').first()
            
            if ultimo_transaccion:
                # Si existe una transacción, usa su costo unitario
                precio_unitario = Decimal(ultimo_transaccion.costo_unitario)
            else:
                # Si no hay transacción, establecer un precio predeterminado
                precio_unitario = Decimal('0.00')
                
        total_fila = Decimal(transaccion.cant_averia) * precio_unitario
        totalCosto += total_fila
        
        data.append([   transaccion.cod_inventario.cod_inventario,
                        transaccion.cod_inventario.nombre,
                        transaccion.cant_averia,
                        f"{precio_unitario:,.2f}"])
        
    
    # Crear la tabla
    table = Table(data)
    table.setStyle(TableStyle([ ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                                ('WORDWRAP', (0, 0), (-1, -1), True)]))

    content.append(table)
    content.append(Spacer(1, 20))
    content.append(Paragraph(f"Total Costo Averías: {totalCosto:,.2f}", styles['Normal']))

    # Generar el PDF
    pdf.build(content)

    # Devolver el archivo como una respuesta HTTP
    pdf_buffer.seek(0)
    response = HttpResponse(pdf_buffer, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename=informe_averia_{id_averia}.pdf'
    return response