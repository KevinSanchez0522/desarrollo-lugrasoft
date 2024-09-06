from django.shortcuts import redirect, render, get_object_or_404
from facturacion.models import Clientes

# Create your views here.

def clientes(request):
    clientes = Clientes.objects.all()
    return render(request, 'clientes.html', {'clientes':clientes})


def actualizar_datos_cliente(request):
        if request.method == 'POST':
            nit = request.POST.get('nit')
            nombre = request.POST.get('name')
            direccion = request.POST.get('direccion')
            telefono = request.POST.get('telefono')
            email = request.POST.get('email')


            # Verificar si el cliente con el NIT existe
            cliente = get_object_or_404(Clientes, nit=nit)

            # Actualizar los datos del cliente
            cliente.nombre = nombre
            cliente.direccion = direccion
            cliente.telefono = telefono
            cliente.email = email
            cliente.save()

            # Devolver al usuario a la URL anterior
            previous_url = request.META.get('HTTP_REFERER')
            return redirect(previous_url)