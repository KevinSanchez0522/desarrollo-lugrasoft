document.addEventListener('DOMContentLoaded', function() {
    $(document).ready(function() {
        $('#cliente').select2();
        $('#Bproducto').select2();
        $('#orden').select2();

        
        });
        // Obtener la fecha actual
        var fechaActual = obtenerFechaActual().toISOString().split('T')[0];
        // Formatear la fecha actual como YYYY-MM-DD
        $('#fechaActual').text(fechaActual).prop('readonly', 'readonly');
        // Establecer la fecha por defecto en el campo de fecha
        var precioTotal = 0;
        var subtotalTotal =0;
        var ivaSobreSubtotalTotal = 0;
        var iva = 0;

        $.ajax({
            url: obtenerfactura,
            type: 'GET',
            success: function(response) {
                // Acceder a los datos recibidos
                var numeroFactura = response.numero_factura;
                var ultimaFactura = response.ultima_factura;
        
                // Manejar los datos según corresponda
                if (numeroFactura) {
                    $('.facturaN').text(numeroFactura);
                    console.log('Nuevo ajuste:', numeroFactura);
                }
                if (ultimaFactura) {
                    $('.facturaN').text(ultimaFactura);
                } else {
                    $('.ultimo_ajuste').text('No hay ajustes anteriores');
                }
            },
            error: function(xhr, status, error) {
                console.error('Error en la solicitud AJAX:', error);
            }
        });

        $('#cliente').on('change', function() {
            var selectedOption = $(this).find(':selected');
            var direccion = selectedOption.data('direccion');
            var telefono = selectedOption.data('telefono');
            var correo = selectedOption.data('correo');
            var nitCliente = selectedOption.data('nit')
    
            // Actualizar los spans con la información correspondiente
            $('#spanDireccion').text(direccion);
            $('#spanTelefono').text(telefono);
            $('#spanCorreo').text(correo);

            $.ajax({
                url: obtenerOrdenCliente, // URL donde se procesará la solicitud en Django
                type: 'GET',
                data: {
                    nit_cliente: nitCliente // Enviar el nit del cliente como parámetro GET
                },
                success: function(response) {
                    if (response.transacciones && response.transacciones.length > 0) {
                        console.log('Datos recibidos:', response.transacciones);
                        
                        // Limpiar el selector de órdenes
                        $('#orden').empty();
                        $('#orden').append('<option value=""># Orden</option>'); // Opción por defecto
                        
                        // Usar un conjunto para almacenar IDs únicos de orden
                        var idOrdenesSet = new Set();
                        
                        // Iterar sobre las transacciones recibidas y añadir IDs únicos al conjunto
                        response.transacciones.forEach(function(transaccion) {
                            idOrdenesSet.add(transaccion.id_orden);
                        });
                        
                        // Convertir el conjunto a un array para poder iterar y agregar al selector
                        var idOrdenesArray = Array.from(idOrdenesSet);
                        idOrdenesArray.forEach(function(idOrden) {
                            $('#orden').append('<option value="' + idOrden + '">' + idOrden + '</option>');
                        });
                    } else {
                        console.error('No se encontraron transacciones pendientes de facturación para este cliente.');
                        
                        // Limpiar el selector de órdenes en caso de no encontrar ninguna orden válida
                        $('#orden').empty();
                        $('#orden').append('<option value="">No se encontraron órdenes por facturar</option>');
                    }
                },
                error: function(xhr, status, error) {
                    console.error('Error al cargar las órdenes:', error);
                    
                    // Manejar el error de la petición AJAX
                    $('#orden').empty();
                    $('#orden').append('<option value="">Error al cargar órdenes</option>');
                }
            });

        });
        $('#orden').on('change', function() {
            var idOrden = $(this).val();  // Obtener el valor seleccionado (id_orden)
            var subtotal = 0;
            var ivaSobreSubtotalTotal = 0;
            var subtotalTotal = 0;
            var precioTotal = 0;
            
        
            // Verificar si se seleccionó una opción válida
            if (idOrden) {
                // Llamar a la función para enviar la solicitud AJAX con el id_orden seleccionado
                $.ajax({
                    url: DatosFacturacion,  // URL donde se procesará la solicitud en Django
                    type: 'GET',  // Método de solicitud (GET o POST según tu configuración en Django)
                    data: {
                        id_orden: idOrden  // Datos a enviar, en este caso el id_orden seleccionado
                    },
                    success: function(response) {
                        // Manejar la respuesta exitosa de la vista Django aquí
                        console.log('Respuesta de Django:', response);
        
                        // Limpiar la tabla antes de agregar nuevos datos
                        $('#tabla-formulario tbody').empty();
        
                        // Verificar el estado del checkbox de IVA
                        var incluirIVA = $('#checkIva').prop('checked');
                        
        
                        // Iterar sobre los datos recibidos y agregar filas a la tabla
                        $.each(response.datos, function(index, dato) {
                            // Determinar qué subtotal mostrar dependiendo de si se incluye IVA o no
                            var subtotal_venta_mostrar = incluirIVA ? dato.total_venta : dato.subtotal_venta;
                            var subtotal_venta_formateado = '$' + ' ' + subtotal_venta_mostrar.toLocaleString('es-ES', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            });
        
                            var fila = '<tr>' +
                                        '<td>' + dato.id_producto + '</td>' +
                                        '<td>' + dato.nombre + '</td>' +
                                        '<td>' + dato.cantidad + '</td>' +
                                        '<td><input type = "text"  class= "valoreditable" value = "' + subtotal_venta_formateado +'" </td>' +
                                       '</tr>';
        
                            $('#tabla-formulario tbody').append(fila);
                            iva = dato.iva;
        
                            // Calcular subtotal total solo si se incluye IVA
                            if (incluirIVA) {
                                subtotal += dato.total_venta  * dato.cantidad;
                                ivaSobreSubtotalTotal += (dato.total_venta * dato.cantidad * (iva/ 100));
                                subtotalTotal = (subtotal - ivaSobreSubtotalTotal);
                            } else {
                                subtotalTotal += dato.subtotal_venta * dato.cantidad;
                            }
                        });
        
                        // Calcular Precio Total
                        precioTotal = incluirIVA ? (subtotalTotal + ivaSobreSubtotalTotal) : subtotalTotal;
        
                        // Mostrar los valores calculados
                        $('.ValorSubtotal').text('$ ' + subtotalTotal.toLocaleString('es-ES', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        }));
                        $('.ValorIva').text(incluirIVA ? ('$ ' + ivaSobreSubtotalTotal.toLocaleString('es-ES', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })) : '');
                        $('.Ptotal').text('$ ' + precioTotal.toLocaleString('es-ES', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        }));
                    },  
                    error: function(xhr, status, error) {
                        // Manejar errores de la solicitud AJAX aquí
                        console.error('Error en la solicitud AJAX:', error);
                    }
                });
            } else {
                console.log('Seleccionó una opción inválida');
            }
        });


        
        $('#tabla-formulario').on('input', '.valoreditable', function() {
            var subtotal = 0;
            var ivaSobreSubtotalTotal = 0;
            var subtotalTotal = 0;
            var precioTotal = 0;
        
            // Obtener el estado del checkbox de IVA
            var incluirIVA = $('#checkIva').prop('checked');
        
            // Recalcular los valores
            $('#tabla-formulario tbody tr').each(function() {
                var subtotal_venta = parseFloat($(this).find('.valoreditable').val().replace(/[^0-9.-]+/g, ""));
                
                if (isNaN(subtotal_venta)) {
                    subtotal_venta = 0;
                }
                
                var cantidad = parseFloat($(this).find('td:nth-child(3)').text());
                
                // Sumar los valores
                subtotalTotal += subtotal_venta * cantidad;
            });
        
            // Calcular IVA si está incluido
            if (incluirIVA) {
                ivaSobreSubtotalTotal = (subtotalTotal * iva) / 100; // IVA del 19%
                subtotalTotal = subtotalTotal- ivaSobreSubtotalTotal
                precioTotal = subtotalTotal + ivaSobreSubtotalTotal;
            } else {
                ivaSobreSubtotalTotal = 0;
                precioTotal = subtotalTotal;
            }
        
            // Mostrar los valores recalculados
            $('.ValorSubtotal').text('$ ' + subtotalTotal.toLocaleString('es-ES', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }));
            $('.ValorIva').text(incluirIVA ? ('$ ' + ivaSobreSubtotalTotal.toLocaleString('es-ES', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })) : '');
            $('.Ptotal').text('$ ' + precioTotal.toLocaleString('es-ES', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }));
        });
        
        $('.bt-facturar').on('click', function() {
            // Obtener datos del cliente seleccionado
            event.preventDefault();
            
            var direccion = $('#cliente option:selected').data('direccion');
            var telefono = $('#cliente option:selected').data('telefono');
            var correo = $('#cliente option:selected').data('correo');
            var nitCliente = $('#cliente option:selected').data('nit')
    
            // Obtener datos de la orden seleccionada
            var orden = $('#orden').val();
    
            // Obtener productos de la tabla
            var productos = [];
            $('#tabla-formulario tbody tr').each(function() {
                var idProducto = $(this).find('td:eq(0)').text();
                var nombreProducto = $(this).find('td:eq(1)').text();
                var cantidad = $(this).find('td:eq(2)').text();
                var costoUnitario = $(this).find('td:eq(3)').text();
    
                productos.push({
                    id_producto: idProducto,
                    nombre: nombreProducto,
                    cantidad: cantidad,
                    costo_unitario: costoUnitario
                });
            });
    
            // Obtener estado de los checkboxes de IVA e ICA
            var incluirIVA = $('#checkIva').prop('checked');
            var incluirICA = $('#checkIca').prop('checked');
            var factura = $('.facturaN').text();
    
            // Obtener valores de subtotal, IVA e ICA
            var subtotal = $('.ValorSubtotal').text().replace('$', '').trim();
            var iva = $('.ValorIva').text().replace('$', '').trim();
            var ica = $('.ValorIca').text().replace('$', '').trim();
            var total = $('.Ptotal').text().replace('$', '').trim();
            var fechaactual = $('#fechaActual').text()
    
            // Construir objeto con todos los datos
            var datosFacturacion = {
                factura : factura,
                cliente: nitCliente,
                direccion: direccion,
                telefono: telefono,
                correo: correo,
                orden: orden,
                productos: productos,
                incluir_iva: incluirIVA,
                incluir_ica: incluirICA,
                subtotal: subtotal,
                iva: iva,
                ica: ica,
                total: total,
                fecha : fechaactual,
                estado: 'facturado'
            };
            console.log('datos js :', datosFacturacion)

              // Mostrar la confirmación al usuario
            if (confirm('¿Estás seguro de Facturar la orden ?')) {
                // Si el usuario confirma, enviar el formulario
                $.ajax({
                    url: Facturacion,  // URL donde se procesará la solicitud en Django
                    type: 'POST',  // Método de solicitud (POST según tu configuración en Django)
                    headers: {
                        'Content-Type': 'application/json',
                        "X-CSRFToken": getCookie("csrftoken")
                    },
                    data: JSON.stringify(datosFacturacion),  // Datos a enviar al servidor
                    success: function(response) {
                        // Manejar la respuesta exitosa del servidor aquí
                        console.log('Respuesta del servidor:', response);
                        // Aquí podrías mostrar un mensaje de éxito o redireccionar a otra página
                        location.reload();
                    },
                    error: function(xhr, status, error) {
                        // Manejar errores de la solicitud AJAX aquí
                        console.error('Error en la solicitud AJAX:', error);
                    }
                });
                
            } else {
                // Si el usuario cancela, no hacer nada
                return false;
            }
            
            // Realizar la solicitud AJAX para enviar los datos al servidor
            
        });
         // Guardar el total original
        
        $('#checkIca').on('change', function() {
            var originalPtotal = precioTotal 
            
            // Verificar si el checkbox está marcado o no
            if ($(this).prop('checked')) {
                // Calcular el 2.5% del total
                var ica = 2.5
                console.log('obtencion del numero Ptotal', originalPtotal)

                var numeroLimpio = originalPtotal;  // Elimina todo excepto dígitos y coma

                // Reemplazar la coma (,) por punto (.) como separador decimal
                numeroLimpio = numeroLimpio;
                console.log(numeroLimpio); 

                // Convertir la cadena limpia a un número
                var total = parseFloat(numeroLimpio);
                console.log('total', total)
                var valorIca = (total * ica) /100; // Calcular el 2.5%
        
                // Actualizar el valor de .ValorIca
                $('.ValorIca').text('$ ' + valorIca.toLocaleString()); // Actualizar el contenido de .ValorIca con el valor calculado
                var nuevoTotal = total - valorIca;
                $('.Ptotal').text('$ ' + nuevoTotal.toLocaleString()); // Actualizar el contenido de .Ptotal con el nuevo total
            } else {
                // Si el checkbox no está marcado, establecer .ValorIca a vacío o a cero según tu caso
                  // Restaurar el valor original de .ValorIca
                $('.ValorIca').text('$ ');
                $('.Ptotal').text('$ ' + originalPtotal.toLocaleString());  
            }
            
        });
        $('#Bproducto').on('change', function() {
            var cod_inventario = $(this).val();
            console.log('cod_inventario', cod_inventario)

            $.ajax({
                url: precioPorProducto,  // Reemplaza por la URL correcta de tu aplicación Django
                type: 'GET',
                data: {
                    codigo: cod_inventario
                },
                success: function(response) {
                    // Manejar la respuesta exitosa del servidor
                    console.log('Datos recibidos:', response);
                    
                    // Aquí puedes actualizar la interfaz de usuario con los datos recibidos
                    var datos = response.datos;  // Array de objetos con los datos de las fórmulas
                    var incluirIVA = $('#checkIva').prop('checked');
                    
                    // Por ejemplo, podrías iterar sobre los datos para mostrarlos en tu página
                    datos.forEach(function(formula) {
                        console.log('ID Producto:', formula.id_producto);
                        console.log('Nombre:', formula.nombre);
                        console.log('IVA:', formula.iva);
                        console.log('Subtotal Costo:', formula.subtotal_costo);
                        console.log('Total Costo:', formula.total_costo);
                        console.log('Subtotal Venta:', formula.subtotal_venta);
                        console.log('Total Venta:', formula.total_venta);
                        console.log('IVA Costo:', formula.iva_costo);
                        console.log('Utilidad Bruta:', formula.utilidad_bruta);

                        
                        var subtotal_venta_mostrar = incluirIVA ? formula.total_venta : formula.subtotal_venta;
                        var subtotal_venta_formateado = '$' + ' ' + subtotal_venta_mostrar.toLocaleString();
                        var fila = '<tr>' +
                                        '<td>' + formula.id_producto + '</td>' +
                                        '<td>' + formula.nombre + '</td>' +
                                        '<td><input type="int" id="campo_editable" value="" /></td>' +  // Campo editable
                                        '<td>' + subtotal_venta_formateado+ '</td>' +
                                        '<td><a href="#" class="iconoBorrar"> <i class="bi bi-trash"></i></a></td>' +
                                        '</tr>';
        
                            $('#tabla-formulario tbody').append(fila);
                        
                            $('#tabla-formulario tbody').on('blur', '#campo_editable', function() {
                                var incluirIVA = $('#checkIva').prop('checked'); 
                                if (incluirIVA) {
                                    var nuevoValor = parseFloat($(this).val());
                                    
                                    var totalProducto = formula.total_venta * nuevoValor
                                    subtotalTotal += totalProducto
                                    var iva = totalProducto *0.19
                                    ivaSobreSubtotalTotal += iva
                                    
                                } else {
                                    var nuevoValor = parseFloat($(this).val());
                                    
                                    
                                    var totalProducto = formula.subtotal_venta * nuevoValor
                                    subtotalTotal += totalProducto
                                    
                                    
                                    
                                }
                                precioTotal +=totalProducto
                                // Actualizar los elementos HTML con los nuevos valores calculados
                                $('.ValorSubtotal').text('$ ' + subtotalTotal.toLocaleString());
                                $('.ValorIva').text(incluirIVA ? ('$ ' + ivaSobreSubtotalTotal.toLocaleString()) : '');
                                $('.Ptotal').text('$ ' + precioTotal.toLocaleString());
                            });
                            $('#tabla-formulario tbody').on('click', '.iconoBorrar', function(e) {
                                e.preventDefault();  // Prevenir el comportamiento predeterminado del enlace
                        
                                // Obtener la fila padre (tr) del ícono de borrado clicado
                                var fila = $(this).closest('tr');

                                // Obtener el valor del campo editable antes de eliminar la fila
                                var valorCampoEditable = parseFloat(fila.find('#campo_editable').val());

                                
                                // Restar los valores correspondientes a los totales acumulados
                                if ($('#checkIva').prop('checked')) {
                                    
                                    var totalProducto = formula.total_venta * valorCampoEditable;
                                    subtotalTotal -= totalProducto
                                    var iva = totalProducto * 0.19;
                                    ivaSobreSubtotalTotal -= iva;
                                } else {
                                    var totalProducto = formula.subtotal_venta * valorCampoEditable;
                                    subtotalTotal -= totalProducto;
                                }
                                precioTotal -= totalProducto;

                                // Eliminar la fila de la tabla
                                fila.remove();

                                // Actualizar los elementos HTML con los nuevos valores calculados
                                $('.ValorSubtotal').text('$ ' + subtotalTotal.toLocaleString());
                                $('.ValorIva').text($('#checkIva').prop('checked') ? ('$ ' + ivaSobreSubtotalTotal.toLocaleString()) : '');
                                $('.Ptotal').text('$ ' + precioTotal.toLocaleString());

                            });
                    });

                
                },
                error: function(xhr, status, error) {
                    // Manejar errores de la solicitud AJAX
                    console.error('Error en la solicitud AJAX:', error);
                }
            });
            


        });

    

});

function obtenerFechaActual() {
    // Obtener la fecha y hora actuales en UTC
    var fechaActual = new Date();
    
    // Obtener el desplazamiento horario en minutos desde UTC para la zona horaria de Colombia (UTC-5)
    var offsetColombia = -5 * 60;
    
    // Calcular la fecha y hora en la zona horaria de Colombia
    var fechaColombia = new Date(fechaActual.getTime() + offsetColombia * 60 * 1000);
    
    return fechaColombia;
}


function getCookie(name) {
var cookieValue = null;
if (document.cookie && document.cookie !== '') {
var cookies = document.cookie.split(';');
for (var i = 0; i < cookies.length; i++) {
var cookie = cookies[i].trim();
// Verificar si la cookie comienza con el nombre deseado
if (cookie.substring(0, name.length + 1) === (name + '=')) {
cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
break;
}
}
}
return cookieValue;
}
