# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models


class Averias(models.Model):
    id_averia = models.IntegerField(primary_key=True)

    class Meta:
        managed = False
        db_table = 'Averias'


class Clientes(models.Model):
    nit = models.DecimalField(db_column='Nit', primary_key=True, max_digits=65535, decimal_places=65535)  # Field name made lowercase.
    nombre = models.TextField()
    direccion = models.TextField()
    telefono = models.DecimalField(max_digits=65535, decimal_places=65535)
    email = models.TextField()

    class Meta:
        managed = False
        db_table = 'Clientes'


class Facturas(models.Model):
    nfactura = models.IntegerField(db_column='Nfactura', primary_key=True)  # Field name made lowercase.
    fecha_facturacion = models.DateField()
    total_factura = models.FloatField()
    id_orden_field = models.IntegerField(db_column='id_orden ')    # Field renamed to remove unsuitable characters. Field renamed because it ended with '_'.
    cliente = models.IntegerField()
    estado = models.TextField()

    class Meta:
        managed = False
        db_table = 'Facturas '


class OrdenProduccion(models.Model):
    id_orden = models.IntegerField(primary_key=True)
    nit = models.ForeignKey(Clientes, models.DO_NOTHING, db_column='Nit')  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'Orden_produccion'


class Remisiones(models.Model):
    nremision = models.IntegerField(db_column='Nremision', primary_key=True)  # Field name made lowercase.
    fecha_remision = models.DateField()
    total_remision = models.FloatField()
    id_orden = models.IntegerField()
    cliente = models.IntegerField()
    estado = models.TextField()
    class Meta:
        managed = False
        db_table = 'Remisiones'


class SalidasMpOrden(models.Model):
    cod_inventario = models.ForeignKey('Inventario', models.DO_NOTHING, db_column='cod_inventario')
    cantidad = models.IntegerField()
    id_orden = models.ForeignKey(OrdenProduccion, models.DO_NOTHING, db_column='id_orden')
    fecha_e_produccion = models.DateField(db_column='fecha_E_produccion', blank=True, null=True)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'Salidas_Mp_Orden'


class TransaccionFactura(models.Model):
    nfactura = models.ForeignKey(Facturas, models.DO_NOTHING, db_column='Nfactura')  # Field name made lowercase.
    cod_inventario = models.IntegerField()
    cantidad = models.IntegerField()
    fecha_factura = models.DateField()
    precio_venta = models.FloatField()

    class Meta:
        managed = False
        db_table = 'Transaccion_Factura'


class TransaccionRemision(models.Model):
    nremision = models.ForeignKey(Remisiones, models.DO_NOTHING, db_column='Nremision')  # Field name made lowercase.
    cod_inventario = models.IntegerField()
    cantidad = models.IntegerField()
    fecha_remision = models.DateField()
    precio_venta = models.FloatField()

    class Meta:
        managed = False
        db_table = 'Transaccion_Remision'


class TransaccionAjuste(models.Model):
    fecha_ajuste = models.DateField()
    cant_ajuste = models.DecimalField(max_digits=65535, decimal_places=65535)
    descripcion = models.TextField(blank=True, null=True)
    id_ajuste = models.ForeignKey('Ajustes', models.DO_NOTHING, db_column='id_ajuste')
    cod_inventario = models.ForeignKey('Inventario', models.DO_NOTHING, db_column='cod_inventario')

    class Meta:
        managed = False
        db_table = 'Transaccion_ajuste'


class TransaccionAverias(models.Model):
    cant_averia = models.DecimalField(max_digits=65535, decimal_places=65535)
    fecha_averia = models.DateField()
    id_averia = models.ForeignKey(Averias, models.DO_NOTHING, db_column='id_averia')
    cod_inventario = models.ForeignKey('Inventario', models.DO_NOTHING, db_column='cod_inventario')

    class Meta:
        managed = False
        db_table = 'Transaccion_averias'


class TransaccionOrden(models.Model):
    fecha_entrega = models.DateField(db_column='fecha_Entrega')  # Field name made lowercase.
    estado = models.TextField()
    cod_inventario = models.ForeignKey('Inventario', models.DO_NOTHING, db_column='cod_inventario')
    cantidad = models.IntegerField()
    id_orden = models.ForeignKey(OrdenProduccion, models.DO_NOTHING, db_column='id_orden')
    prioridad = models.TextField()
    fecha_creacion = models.DateField()
    responsable = models.TextField()
    fecha_terminacion_orden = models.DateField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'Transaccion_orden'


class Ventas(models.Model):
    id_venta = models.IntegerField(primary_key=True)
    id_factura = models.IntegerField()
    id_remi = models.IntegerField()

    class Meta:
        managed = False
        db_table = 'Ventas'


class Ajustes(models.Model):
    id_ajuste = models.IntegerField(primary_key=True)

    class Meta:
        managed = False
        db_table = 'ajustes'


class AuthGroup(models.Model):
    name = models.CharField(unique=True, max_length=150)

    class Meta:
        managed = False
        db_table = 'auth_group'


class AuthGroupPermissions(models.Model):
    id = models.BigAutoField(primary_key=True)
    group = models.ForeignKey(AuthGroup, models.DO_NOTHING)
    permission = models.ForeignKey('AuthPermission', models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'auth_group_permissions'
        unique_together = (('group', 'permission'),)


class AuthPermission(models.Model):
    name = models.CharField(max_length=255)
    content_type = models.ForeignKey('DjangoContentType', models.DO_NOTHING)
    codename = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = 'auth_permission'
        unique_together = (('content_type', 'codename'),)


class AuthUser(models.Model):
    password = models.CharField(max_length=128)
    last_login = models.DateTimeField(blank=True, null=True)
    is_superuser = models.BooleanField()
    username = models.CharField(unique=True, max_length=150)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    email = models.CharField(max_length=254)
    is_staff = models.BooleanField()
    is_active = models.BooleanField()
    date_joined = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'auth_user'


class AuthUserGroups(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(AuthUser, models.DO_NOTHING)
    group = models.ForeignKey(AuthGroup, models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'auth_user_groups'
        unique_together = (('user', 'group'),)


class AuthUserUserPermissions(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(AuthUser, models.DO_NOTHING)
    permission = models.ForeignKey(AuthPermission, models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'auth_user_user_permissions'
        unique_together = (('user', 'permission'),)


class Compras(models.Model):
    total_factura = models.IntegerField()
    estado = models.BooleanField()
    id_compra = models.TextField(primary_key=True)

    class Meta:
        managed = False
        db_table = 'compras'


class DjangoAdminLog(models.Model):
    action_time = models.DateTimeField()
    object_id = models.TextField(blank=True, null=True)
    object_repr = models.CharField(max_length=200)
    action_flag = models.SmallIntegerField()
    change_message = models.TextField()
    content_type = models.ForeignKey('DjangoContentType', models.DO_NOTHING, blank=True, null=True)
    user = models.ForeignKey(AuthUser, models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'django_admin_log'


class DjangoContentType(models.Model):
    app_label = models.CharField(max_length=100)
    model = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = 'django_content_type'
        unique_together = (('app_label', 'model'),)


class DjangoMigrations(models.Model):
    id = models.BigAutoField(primary_key=True)
    app = models.CharField(max_length=255)
    name = models.CharField(max_length=255)
    applied = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'django_migrations'


class DjangoSession(models.Model):
    session_key = models.CharField(primary_key=True, max_length=40)
    session_data = models.TextField()
    expire_date = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'django_session'


class Inventario(models.Model):
    cod_inventario = models.IntegerField(primary_key=True)
    nombre = models.TextField()
    cantidad = models.IntegerField()
    id_proveedor = models.ForeignKey('Proveedores', models.DO_NOTHING, db_column='id_proveedor')
    tipo = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'inventario'


class ProduccionSalidasmporden(models.Model):
    id = models.BigAutoField(primary_key=True)
    cantidad = models.IntegerField()
    fecha_salida = models.DateField()
    cod_inventario = models.ForeignKey(Inventario, models.DO_NOTHING, db_column='cod_inventario')

    class Meta:
        managed = False
        db_table = 'produccion_salidasmporden'


class Proveedores(models.Model):
    id_proveedor = models.IntegerField(primary_key=True)
    nombre_proveedor = models.TextField()
    direccion = models.TextField(blank=True, null=True)
    telefono = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'proveedores'


class TransMp(models.Model):
    nombre_mp = models.TextField()
    cant_mp = models.IntegerField()
    costo_unitario = models.FloatField()
    total_linea = models.FloatField()
    fecha_ingreso = models.DateField()
    unidad_medida = models.TextField()
    id_proveedor = models.IntegerField()
    cod_inventario = models.ForeignKey(Inventario, models.DO_NOTHING, db_column='cod_inventario')
    tipo = models.TextField(blank=True, null=True)
    id_compra = models.ForeignKey(Compras, models.DO_NOTHING, db_column='id_compra')

    class Meta:
        managed = False
        db_table = 'trans_mp'


class Transformulas(models.Model):
    nombre = models.TextField()
    materia1 = models.IntegerField(blank=True, null=True)
    cant_materia1 = models.FloatField(blank=True, null=True)
    materia2 = models.IntegerField(blank=True, null=True)
    cant_materia2 = models.FloatField(blank=True, null=True)
    materia3 = models.IntegerField(blank=True, null=True)
    cant_materia3 = models.FloatField(blank=True, null=True)
    materia4 = models.IntegerField(blank=True, null=True)
    cant_materia4 = models.FloatField(blank=True, null=True)
    materia5 = models.IntegerField(blank=True, null=True)
    cant_materia5 = models.FloatField(blank=True, null=True)
    materia6 = models.IntegerField(blank=True, null=True)
    cant_materia6 = models.FloatField(blank=True, null=True)
    materia7 = models.IntegerField(blank=True, null=True)
    cant_materia7 = models.FloatField(blank=True, null=True)
    materia8 = models.IntegerField(blank=True, null=True)
    cant_materia8 = models.FloatField(blank=True, null=True)
    cod_inventario = models.ForeignKey(Inventario, models.DO_NOTHING, db_column='cod_inventario')
    porcentajeiva = models.FloatField()
    pocentajeutilidad = models.FloatField()
    costosindirectos = models.FloatField()

    class Meta:
        managed = False
        db_table = 'transformulas'
