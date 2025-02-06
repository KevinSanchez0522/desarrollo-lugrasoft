import json
from django.http import JsonResponse
from django.shortcuts import render, redirect

# Create your views here.
from django.contrib.auth.decorators import login_required
from django.contrib.auth import logout
from facturacion.models import TransaccionOrden, TransaccionFactura, TransaccionRemision, Facturas, Remisiones, Inventario
from django.utils.dateparse import parse_date
from django.db.models import Avg, Sum, Count


def InicioSesion(request):
    return render(request, 'inicio.html')
# Create your views here.


def Validar_Credenciales(request):
    
    return redirect('/dash/')


@login_required    
def Dashboard(request):
    return render(request, 'dashboard.html')


def exit(request):
    logout(request)
    return redirect('inicio')


def listarOrden(request):
    if request.method == 'POST':
        # Contar las órdenes en cada estado
        conteos = {
            'creado': TransaccionOrden.objects.filter(estado='creado').count(),
            'en_proceso': TransaccionOrden.objects.filter(estado='en proceso').count(),
            'por_facturar': TransaccionOrden.objects.filter(estado='por facturar').count(),
        }

        # Devolver los datos en formato JSON
        return JsonResponse(conteos)

    else:
        return JsonResponse({'error': 'Método no permitido'}, status=405)
    
    
    
def promediarVentas(request):   
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            start_date = data.get('start_date')
            end_date = data.get('end_date')

            if not start_date or not end_date:
                return JsonResponse({'error': 'Fechas no proporcionadas'}, status=400)

            # Convertir las fechas a objetos de fecha
            start_date = parse_date(start_date)
            end_date = parse_date(end_date)

            if not start_date or not end_date:
                return JsonResponse({'error': 'Formato de fecha incorrecto'}, status=400)

            # Filtrar ventas por el rango de fechas
            facturas = TransaccionFactura.objects.filter(fecha_factura__range=[start_date, end_date])
            remisiones = TransaccionRemision.objects.filter(fecha_remision__range=[start_date, end_date])

            # Combinar los resultados y calcular el promedio
            total_cantidad = facturas.aggregate(total=Sum('cantidad'))['total'] or 0
            total_cantidad += remisiones.aggregate(total=Sum('cantidad'))['total'] or 0
            total_count = facturas.count() + remisiones.count()

            if total_count == 0:
                promedio = 0
            else:
                promedio = total_cantidad / total_count

            return JsonResponse({'promedio_ventas': promedio})
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Error en el formato JSON'}, status=400)
    else:
        return JsonResponse({'error': 'Método no permitido'}, status=405)
    
    
    
def ventasPorDia(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            start_date = data.get('start_date')
            end_date = data.get('end_date')

            if not start_date or not end_date:
                return JsonResponse({'error': 'Fechas no proporcionadas'}, status=400)

            # Convertir las fechas a objetos de fecha
            start_date = parse_date(start_date)
            end_date = parse_date(end_date)

            if not start_date or not end_date:
                return JsonResponse({'error': 'Formato de fecha incorrecto'}, status=400)

            # Consultar y agrupar ventas por día
            facturas = Facturas.objects.filter(fecha_facturacion__range=[start_date, end_date])
            remisiones = Remisiones.objects.filter(fecha_remision__range=[start_date, end_date])

            # Contar el número de ventas por día
            ventas_por_dia_facturas = facturas.values('fecha_facturacion').annotate(total_ventas=Count('nfactura')).order_by('fecha_facturacion')
            ventas_por_dia_remisiones = remisiones.values('fecha_remision').annotate(total_ventas=Count('nremision')).order_by('fecha_remision')

            # Combinar los resultados
            ventas_por_dia = {}
            for venta in ventas_por_dia_facturas:
                fecha = venta['fecha_facturacion'].strftime('%Y-%m-%d')
                ventas_por_dia[fecha] = ventas_por_dia.get(fecha, 0) + venta['total_ventas']

            for venta in ventas_por_dia_remisiones:
                fecha = venta['fecha_remision'].strftime('%Y-%m-%d')
                ventas_por_dia[fecha] = ventas_por_dia.get(fecha, 0) + venta['total_ventas']

            # Ordenar por fecha
            fechas = sorted(ventas_por_dia.keys())
            conteo_ventas = [ventas_por_dia[fecha] for fecha in fechas]

            return JsonResponse({
                'fechas': fechas,
                'conteo_ventas': conteo_ventas
            })

        except json.JSONDecodeError:
            return JsonResponse({'error': 'Error en el formato JSON'}, status=400)
    else:
        return JsonResponse({'error': 'Método no permitido'}, status=405)
    
def PorAgotarse(request):
    productos = Inventario.objects.all().filter(tipo='m')
    
    return render(request, 'ProductosXagotarse.html', {'productos': productos})