document.addEventListener('DOMContentLoaded', function() {
    $(document).ready(function() {
        $('#cliente').select2();
        $('#Bproducto').select2();
        $('#orden').select2({
            placeholder: "Selecciona # Orden",
            allowClear:true
        });

        
        });
        // Obtener la fecha actual
        var fechaActual = obtenerFechaActual().toISOString().split('T')[0];
        // Formatear la fecha actual como YYYY-MM-DD
        $('#fechaActual').text(fechaActual).prop('readonly', 'readonly');
        // Establecer la fecha por defecto en el campo de fecha
        var precioTotal = 0;
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
                        console.error('No se encontraron transacciones pendientes de facturación.', error);
                        
                        // Limpiar el selector de órdenes en caso de no encontrar ninguna orden válida
                        $('#orden').empty();
                        $('#orden').append('<option value="0">0</option>');
                    }
                },
                error: function(xhr, status, error) {
                    console.error('Error al cargar las órdenes:', error);
                    
                    // Manejar el error de la petición AJAX
                    $('#orden').empty();
                    $('#orden').append('<option value="0">0</option>');
                }
            });

        });
        $('#orden').on('change', function() {
            var idOrdenes = $(this).val();  // Obtener el valor seleccionado (id_ordenes)
            console.log('ids: ', idOrdenes)
        
            // Verificar si se seleccionó una opción válida
            if (idOrdenes && idOrdenes.length > 0) {
                // Llamar a la función para enviar la solicitud AJAX con el id_orden seleccionado
                $.ajax({
                    url: DatosFacturacion,  // URL donde se procesará la solicitud en Django
                    type: 'GET',  // Método de solicitud (GET o POST según tu configuración en Django)
                    data: {
                        ordenes: idOrdenes  // Datos a enviar, en este caso el id_ordenes seleccionado
                    },
                    success: function(response) {
                        // Manejar la respuesta exitosa de la vista Django aquí
                        console.log('Respuesta de Django:', response);
        
                        // Limpiar la tabla antes de agregar nuevos datos
                        $('#tabla-formulario tbody').empty();
        
                        // Verificar el estado del checkbox de IVA
                        var incluirIVA = $('#checkIva').prop('checked');
        
                        // Variable para los totales
                        
        
                        // Iterar sobre las órdenes recibidas
                        $.each(response.ordenes, function(index, orden) {
                            // Mostrar el ID de la orden (si es necesario)
                            var filaOrden = '<tr><td colspan="4"><strong>Orden #: ' + orden.id_orden + '</strong></td></tr>';
                            $('#tabla-formulario tbody').append(filaOrden);
        
                            // Iterar sobre los productos de la orden
                            $.each(orden.productos, function(i, dato) {
                                // Determinar qué subtotal mostrar dependiendo de si se incluye IVA o no
                                var subtotal_venta_mostrar = incluirIVA ? dato.total_venta : dato.subtotal_venta;
                                var subtotal_venta_formateado = formatearNumero(subtotal_venta_mostrar);
        
                                // Crear la fila para el producto
                                var filaProducto = '<tr>' +
                                    '<td>' + dato.id_producto + '</td>' +
                                    '<td>' + dato.nombre + '</td>' +
                                    '<td>' + dato.cantidad + '</td>' +
                                    '<td><input type="text" value="' + subtotal_venta_formateado + '"/></td>' +
                                    '</tr>';
        
                                // Agregar la fila a la tabla
                                $('#tabla-formulario tbody').append(filaProducto);
        
                                // Calcular el subtotal total solo si se incluye IVA
                                var valorProducto = incluirIVA ? dato.total_venta * dato.cantidad : dato.subtotal_venta * dato.cantidad;
                                precioTotal += valorProducto;
        
                                if (incluirIVA) {
                                    ivaSobreSubtotalTotal += valorProducto * (dato.iva / 100);
                                    console.log('iva orden', ivaSobreSubtotalTotal)
                                } else {
                                    ivaSobreSubtotalTotal += 0;
                                }
                            });
                        });
        
                        // Actualizar los totales
                        actualizarTotales(precioTotal, ivaSobreSubtotalTotal);
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
        
        
        $('#tabla-formulario').on('input', 'input',function() {
            recalcularTotales();
        });

        $('#tabla-formulario').on('blur', 'input', function() {
            var valorOriginal = $(this).val().replace(/[^0-9.-]+/g, "");
            $(this).data('prev', valorOriginal); 

            var valorNumero = parseFloat(valorOriginal);
            if (!isNaN(valorNumero)) {
                $(this).val(formatearNumero(valorNumero));
            } else {
                $(this).val('');
            }
        });






        

        function recalcularTotales(){
            var incluirIVA = $('#checkIva').prop('checked');
            precioTotal = 0;
            ivaSobreSubtotalTotal = 0;
            console.log('iva en recalcular totales', ivaSobreSubtotalTotal)
        
            $('#tabla-formulario tbody tr').each(function() {
                var cantidad = parseInt($(this).find('td:nth-child(3)').text().replace(/[^0-9.-]+/g, "")) || 0;
                var subtotal_venta = $(this).find('input').val()
                var numero = parseFloat(String(subtotal_venta).replace(/\./g, '').replace(',', '.'));

                numero = isNaN(numero) ? 0 : numero;
                if (isNaN(subtotal_venta)) {
                    subtotal_venta = 0;
                }
                var subtotalFila = numero * cantidad;
                precioTotal += subtotalFila;
                
                if (incluirIVA) {
                    ivaSobreSubtotalTotal  += subtotalFila * (iva / 100);  // IVA del 19%
                    console.log('iva', ivaSobreSubtotalTotal)
                    }
                });
                actualizarTotales(precioTotal, ivaSobreSubtotalTotal);
        }

        function recalcularTotalesProducto(){
            var incluirIVA = $('#checkIva').prop('checked');
            var ivart= 19;
    
            $('#tabla-formulario tbody tr').each(function() {
                var cantidad = parseInt($(this).find('.cantidad').val()) || 0;
                var valor = $(this).find('.valor');
                var valorelemento = valor.val();
        
                // Verificar que el valor es una cadena
                if (typeof valorelemento !== 'string') {
                    console.error('El valor obtenido no es una cadena:', valorelemento);
                    return;
                }
        
                // Imprimir el valor antes de reemplazar
                console.log('valor producto antes de reemplazar:', valorelemento);
        
                // Reemplazar y convertir el valor a número
                var valorFormateado = valorelemento.replace(/\./g, '').replace(',', '.');
                console.log('valor formateado:', valorFormateado);
        
                var numero = parseFloat(valorFormateado);
                if (isNaN(numero)) {
                    console.error('La conversión a número falló para el valor:', valorFormateado);
                    return;
                }
        
                console.log('valor convertido:', numero);

                // Calcular el valor del producto
                var valorProducto = numero * cantidad;
                console.log('valor producto suma', valorProducto)
                console.log('precio total antes al cambiar', precioTotal)
                precioTotal += valorProducto;
                console.log('precio total despues al cambiar', precioTotal)
                
                
                
                console.log('iva rt', iva)

                // Calcular IVA sobre subtotal
                if (incluirIVA) {
                    ivaSobreSubtotalTotal += valorProducto * (ivart / 100);
                }
                else{
                    ivaSobreSubtotalTotal = 0;
                }

                actualizarTotales(precioTotal, ivaSobreSubtotalTotal);
            });

            // Actualizar los totales
            
            
        }
        // Mostrar los valores recalculados
    function actualizarTotales(precioTotal, ivaSobreSubtotalTotal) {
        var incluirIVA = $('#checkIva').prop('checked');
        ivaSobreSubtotalTotal= (precioTotal*19)/100
        var subtotalTotal = incluirIVA ? (precioTotal - ivaSobreSubtotalTotal) : precioTotal;
        

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
    }

    // Formatear el número con separador de miles y punto decimal
    function formatearNumero(numero) {
        return numero.toLocaleString('es-ES', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
    
        
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

        function agregarProducto(idProducto, nombre, total_venta, subtotal_venta,) {
            var incluirIVA = $('#checkIva').prop('checked');
            var subtotal_venta_mostrar = incluirIVA ? total_venta : subtotal_venta;
            var subtotal_venta_formateado = formatearNumero(subtotal_venta_mostrar);
            var ivarespaldo= 19;

            // Crear una fila con una clase específica para la cantidad
            var fila = '<tr class="producto-row">' +
                    '<td>' + idProducto + '</td>' +
                    '<td>' + nombre + '</td>' +
                    '<td><input class="cantidad" type="text" value="1" /></td>' +
                    '<td><input class="valor" type="text" value="' + subtotal_venta_formateado + '" /></td>' +
                    '<td><a href="#" class="iconoBorrar"> <i class="bi bi-trash"></i></a></td>' +
                    '</tr>';

                    // Solo agregar si no existe ya
                    if ($('#tabla-formulario tbody tr[data-id="' + idProducto + '"]').length === 0) {
                        $('#tabla-formulario tbody').append(fila);
                    }

            var cantidadFila = $('#tabla-formulario tbody tr:last-child .cantidad').val();
            var valorProducto = incluirIVA ? total_venta * cantidadFila : subtotal_venta * cantidadFila;
            precioTotal += valorProducto;
            
            console.log('Cantidad de la fila recién agregada:', cantidadFila);
            
            if (incluirIVA) {
                ivaSobreSubtotalTotal += valorProducto * (ivarespaldo / 100);
                console.log('iva al agregar el producto', ivaSobreSubtotalTotal)
            }else{
                ivaSobreSubtotalTotal += 0;                                
            }

        // Recalcular totales después de agregar el producto
        actualizarTotales(precioTotal, ivaSobreSubtotalTotal)
        }


          // Manejar el evento de cambio en el producto
    $('#Bproducto').on('change', function() {
        var cod_inventario = $(this).val();
        console.log('cod_inventario', cod_inventario);
        

        $.ajax({
            url: precioPorProducto,  // Reemplaza por la URL correcta de tu aplicación Django
            type: 'GET',
            data: {
                codigo: cod_inventario
            },
            success: function(response) {
                    console.log('Datos recibidos:', response);
                    console.log('Datos recibidos:', response);
                    
                    // Aquí puedes actualizar la interfaz de usuario con los datos recibidos
                console.log('Datos recibidos:', response);
                    
                    // Aquí puedes actualizar la interfaz de usuario con los datos recibidos
                var datos = response.datos;  // Array de objetos con los datos de las fórmula

                datos.forEach(function(dato) {

                    agregarProducto(dato.id_producto, dato.nombre, dato.total_venta, dato.subtotal_venta)
                });

                $('#tabla-formulario').off('input', '.cantidad, .valor').on('input', '.cantidad, .valor', function() {
                    recalcularTotalesProducto();
                });
        
                
            
                // Recalcular los valores cuando se cambie el estado del checkbox IVA
                $('#checkIva').on('change', function() {
                    
            
                    var incluirIVA = $(this).prop('checked');
            
                    
            
                        var cantidad = parseInt($(this).find('.campo_editable').val());
                        if (isNaN(cantidad)) {
                            cantidad = 0;
                        }
            
            
            
                        var ultimaFila = $('#tabla-formulario tbody tr').last();
                        var valorCampo2 = parseFloat(ultimaFila.find('td:nth-child(4) input').val().replace(/\./g, '').replace(',', '.')) || 0;
                        var valorCampo1 = parseFloat(ultimaFila.find('td:nth-child(3) input').val().replace(/\./g, '').replace(',', '.')) || 0;
                        console.log('Valor del segundo campo en la última fila:', valorCampo2);
            
                        var totalProducto = 0;
                        totalProducto = valorCampo2 * valorCampo1;
            
                        


                                // Obtener el valor del campo editable antes de eliminar la fila
                                var valorCampoEditable = parseFloat(fila.find('#campo_editable').val());
            
                                // Obtener el valor del campo editable antes de eliminar la fila
                                var valorCampoEditable = parseFloat(fila.find('#campo_editable').val());
            
                        
            
                        if (incluirIVA) {
                            var ivaProducto = totalProducto * (iva / 100);
                            var subtotalP = totalProducto - ivaProducto
                            var total_mostrar = precioTotal + totalProducto;
                            var subtotal_mostrar = subtotalTotal +subtotalP;
                            var iva_mostrar = ivaSobreSubtotalTotal + ivaProducto
                            precioTotal =total_mostrar
                        }else {
                            ivaSobreSubtotalTotal = 0;
                            precioTotal = subtotalTotal;
                        }
            
                                    // Mostrar los valores recalculados
                        $('.ValorSubtotal').text('$ ' + subtotal_mostrar.toLocaleString('es-ES', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        }));
                        $('.ValorIva').text(incluirIVA ? ('$ ' + iva_mostrar.toLocaleString('es-ES', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })) : '');
                        $('.Ptotal').text('$ ' + precioTotal.toLocaleString('es-ES', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        }));
                    
            
                    
                    


                                // Actualizar los elementos HTML con los nuevos valores calculados
                                $('.ValorSubtotal').text('$ ' + subtotalTotal.toLocaleString());
                                $('.ValorIva').text($('#checkIva').prop('checked') ? ('$ ' + ivaSobreSubtotalTotal.toLocaleString()) : '');
                                $('.Ptotal').text('$ ' + precioTotal.toLocaleString());
            
                                // Actualizar los elementos HTML con los nuevos valores calculados
                                $('.ValorSubtotal').text('$ ' + subtotalTotal.toLocaleString());
                                $('.ValorIva').text($('#checkIva').prop('checked') ? ('$ ' + ivaSobreSubtotalTotal.toLocaleString()) : '');
                                $('.Ptotal').text('$ ' + precioTotal.toLocaleString());
            
                });
            
                // Manejar el evento de borrado
                $('#tabla-formulario').on('click', '.iconoBorrar', function(e) {
                    e.preventDefault(); // Prevenir la acción predeterminada del enlace
                    $(this).closest('tr').remove();
                        recalcularTotales();
                        recalcularTotalesProducto();
                    
                    $('#tabla-formulario').trigger('input'); // Trigger input event to recalculate totals
                });

                

                // Mostrar los valores recalculados
                
            }
        });



    });
    

        

    
        
    $('.bt-facturar').on('click', function() {
        // Obtener datos del cliente seleccionado
        
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
                // Obtener la cantidad y el costo unitario, que pueden estar en campos editables (input)
            var cantidad = $(this).find('td:eq(2) input').length ? 
                            $(this).find('td:eq(2) input').val() : 
                            $(this).find('td:eq(2)').text();

            var costoUnitario = $(this).find('td:eq(3) input').length ? 
                                $(this).find('td:eq(3) input').val() : 
                                $(this).find('td:eq(3)').text();
            if (idProducto && idProducto !== 'Orden #' && cantidad && costoUnitario) {
                productos.push({
                    id_producto: idProducto,
                    nombre: nombreProducto,
                    cantidad: cantidad,
                    costo_unitario: costoUnitario
                });
            }
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
// Descargar el PDF
                    var blob = new Blob([response], { type: 'application/pdf' });
                    var link = document.createElement('a');
                    link.href = window.URL.createObjectURL(blob);
                    link.download = 'factura_' + datosFacturacion.factura + '.pdf';
                    link.click();
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
function formatearNumero(numero) {
     // Usa `toLocaleString` para formatear el número en formato con separadores de miles y decimales
    var formato = numero.toLocaleString('es-ES', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    // Añade el símbolo de dólar antes del número
    return `$ ${formato}`;
}
