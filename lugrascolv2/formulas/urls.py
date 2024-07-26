from django.urls import path
from .views import verFormula, vertabla, guardar_datos, verformulas, actualizar_transformula,eliminarFormula

urlpatterns = [
    path('', verFormula, name='formula'),
    path('ver', vertabla, name= 'ver'),
    path('guardar/', guardar_datos, name= 'guardar_datos'),
    path('verformula/', verformulas, name= 'verformula'),
    path('actualizar_transformula/', actualizar_transformula, name='actualizar_transformula'),
    path('eliminarF/<int:cod_inventario>/', eliminarFormula , name= 'EliminarFormula')
    
]