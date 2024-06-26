# Generated by Django 5.0.4 on 2024-06-07 15:06

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Compras',
            fields=[
                ('id_compra', models.IntegerField(primary_key=True, serialize=False)),
                ('total_factura', models.IntegerField()),
                ('estado', models.BooleanField()),
            ],
            options={
                'db_table': 'compras',
                'managed': False,
            },
        ),
        migrations.CreateModel(
            name='Inventario',
            fields=[
                ('cod_inventario', models.IntegerField(primary_key=True, serialize=False)),
                ('nombre', models.TextField()),
                ('cantidad', models.IntegerField()),
                ('tipo', models.TextField(blank=True, null=True)),
            ],
            options={
                'db_table': 'inventario',
                'managed': False,
            },
        ),
        migrations.CreateModel(
            name='Proveedores',
            fields=[
                ('id_proveedor', models.IntegerField(primary_key=True, serialize=False)),
                ('nombre_proveedor', models.TextField()),
                ('direccion', models.TextField(blank=True, null=True)),
                ('telefono', models.TextField(blank=True, null=True)),
            ],
            options={
                'db_table': 'proveedores',
                'managed': False,
            },
        ),
        migrations.CreateModel(
            name='TransMp',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nombre_mp', models.TextField()),
                ('cant_mp', models.IntegerField()),
                ('costo_unitario', models.FloatField()),
                ('total_linea', models.FloatField()),
                ('fecha_ingreso', models.DateField()),
                ('unidad_medida', models.TextField()),
                ('id_proveedor', models.IntegerField()),
                ('tipo', models.TextField(blank=True, null=True)),
            ],
            options={
                'db_table': 'trans_mp',
                'managed': False,
            },
        ),
    ]
