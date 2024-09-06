from django.urls import path
from .views import clientes, actualizar_datos_cliente
urlpatterns = [
    path('', clientes , name= 'Clientes'),
    path('actualizar-datos/', actualizar_datos_cliente, name= 'actualizarDatos')
]