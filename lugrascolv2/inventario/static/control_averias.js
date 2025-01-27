// In your Javascript (external .js resource or <script> tag)

$(document).ready(function() {
    
    var ajusteExistente = {};
    obtenerAjuste();
    var fechaActual = obtenerFechaActual();

    // Formatear la fecha en formato ISO (YYYY-MM-DD) para establecerla como valor predeterminado
    var fechaFormateada = fechaActual.toISOString().split('T')[0];

    // Establecer el valor predeterminado del campo de fecha
    document.getElementById('fecha').value = fechaFormateada;

    $('.js-example-basic-single').select2({
        placeholder: 'Seleccione un producto'
    });
    var primeraFilaAgregada = false;
    // Función para agregar una nueva fila a la tabla
    function agregarFila(selectedValue, selectedName) {
        var newRow = '<tr>' +
                        '<td>' + selectedValue + '</td>' +
                        '<td>' + selectedName + '</td>' +
                        '<td contenteditable="true"></td>' +
                        '<td>' +
                            '<select>' +
                                '<option value="Envase Roto">Envase Roto</option>' +
                                '<option value="Otros">Otros</option>' +
                            '</select>' +
                        '</td>' +
                        '<td><button class="eliminar-fila">Eliminar</button></td>' + // Botón de eliminar
                    '</tr>';
        $('.tabla tbody').append(newRow);
        if (!primeraFilaAgregada && selectedName.trim() !== '' && selectedValue.trim() !== '') {
            console.log('¡Es la primera vez que se agrega una fila y los datos de nombre y código no están vacíos!');
            primeraFilaAgregada = true;
        }
        console.log('Se agregó a la fila: Valor seleccionado:', selectedValue, 'Nombre seleccionado:', selectedName);
    }

    // Capturar el evento de cambio del select
    $('.js-example-basic-single').on('change', function() {
        var selectedValue = $(this).val();
        var selectedName = $(this).find(':selected').text().split('--')[1].trim();
        
        // Agregar una nueva fila a la tabla con los detalles del producto seleccionado
        agregarFila(selectedValue, selectedName);
        
        
    })
                // Controlador de eventos para el botón de eliminar
    $(document).on('click', '.eliminar-fila', function() {
        $(this).closest('tr').remove(); // Eliminar la fila más cercana al botón
    });

    $.ajax({
        url: obtenerAveria,
        type: 'GET',
        success: function(response) {
            // Acceder a los datos recibidos
            var numeroAjuste = response.numero_ajuste;
            var ultimoAjuste = response.ultimo_ajuste;
    
            // Manejar los datos según corresponda
            if (numeroAjuste) {
                $('.najuste').val(numeroAjuste);
                console.log('Nuevo ajuste:', numeroAjuste);
            }
            if (ultimoAjuste) {
                $('.ultimo_ajuste').text('Último ajuste: ' + ultimoAjuste);
            } else {
                $('.ultimo_ajuste').text('No hay ajustes anteriores');
            }
        },
        error: function(xhr, status, error) {
            console.error('Error en la solicitud AJAX:', error);
        }
    });
    

        // Controlador de eventos para el botón de envío
        $('.boton-envio').on('click', function() {
            ajusteExistente.fecha = $('#fecha').val();
            // Abrir modal
            abrirModal();
        });

        // Función para abrir el modal y asignar valores
        function abrirModal() {
            var modal = document.getElementById("myModal");
            var span = document.getElementsByClassName("close")[0];


            // Obtener el valor actualizado de la descripción
            
    
            // Asignar valores de fecha y descripción
            var fecha = $('#fecha').val();
            $('#fecha_ajuste').val(fechaActual);
            
    
            // Abrir modal
            modal.style.display = "block";

            $('#myModal .tabla tbody').empty(); // Vaciar el cuerpo de la tabla en el modal
            $('.tabla tbody tr').each(function() {
                var clonedRow = $(this).clone();
                // Eliminar el atributo contenteditable de la celda de cantidad
                clonedRow.find('td:eq(2)').removeAttr('contenteditable');

                // Quitar la última columna (botón de eliminar)
                clonedRow.find('td:last-child').remove();
                // Establecer el valor deseado en la celda de cantidad
                var cantidadValue = $(this).find('td:eq(2)').text();
                clonedRow.find('td:eq(2)').text(cantidadValue);
                $('#myModal .tabla tbody').append(clonedRow);
            });

            if (Object.keys(ajusteExistente).length !== 0) {
                $('#fecha_ajuste').val(ajusteExistente.fecha);
                $('#fecha_ajuste').prop('readonly', true);
                
            }
    
            // Agregar un evento de clic al botón de cierre para cerrar la ventana modal
            span.onclick = function() {
                           // Al cerrar el modal sin confirmar, actualizar los ajustes existentes
                ajusteExistente.fecha = $('#fecha_ajuste').val();
                modal.style.display = "none";
                $('#fecha_ajuste').val(ajusteExistente.fecha).prop('readonly', true);
            }
    
            // Controlador de eventos para el botón "Guardar ajuste" dentro del modal
            $('#confirmar').off('click').on('click', function(event) {
                // Prevenir el envío del formulario por defecto
                event.preventDefault();
                // Enviar datos al servidor
                enviarDatos();
                // Cerrar modal después de enviar los datos
                modal.style.display = "none";
            });
        }
        
});
function obtenerAjuste() {
    $.ajax({
        url: obtenerAveria,
        type: 'GET',
        success: function(response) {
            ajusteExistente = response;
            // Actualizar los campos de ajuste si el modal está abierto
            if ($('#myModal').is(':visible')) {
                $('#fecha_ajuste').val(ajusteExistente.fecha);
            }
        },
        error: function(xhr, status, error) {
            console.error('Error en la solicitud AJAX:', error);
        }
    });
}

function enviarDatos() {
    var ajusteN = $('#ajusteN').val();
    var fecha = $('#fecha').val();
    var id_averia = ajusteN;
    console.log('id_averia:', id_averia);

    // Array para almacenar los datos de cada fila
    var datos_tabla = [];

    var error = false; // Bandera para detectar errores

    $('#myModal .tabla tbody tr').remove();

    // Iterar sobre cada fila de la tabla y obtener los datos
    $('.tabla tbody tr').each(function() {
        var idProducto = $(this).find('td:eq(0)').text(); // ID Producto
        var nombreProducto = $(this).find('td:eq(1)').text(); // Nombre
        var cantidad = $(this).find('td:eq(2)').text(); // Cantidad
        var motivo = $(this).find('td:eq(3) select').val()

        if (idProducto.trim() !== '') {
            if (cantidad.trim() === '' || isNaN(cantidad.trim())) {
                error = true; // Establecer la bandera de error
                alert('La cantidad para el producto "' + nombreProducto + '" no es válida.');
                return false; // Detener el bucle
            }
            // Agregar los datos al array
            datos_tabla.push({
                'codigo': ajusteN,
                'fecha': fecha,
                'id_producto': idProducto,
                'nombre_producto': nombreProducto,
                'cantidad': cantidad,
                'motivo': motivo
            });
            console.log(datos_tabla);
            var clonedRow = $(this).clone();
            $('#myModal .tabla tbody').append(clonedRow);
        }
    });

    if (error) {
        // Si se detectó un error, no continuar con el envío de datos
        return;
    }

    // Objeto con los datos a enviar al servidor
    var data = {
        'datos_tabla': datos_tabla
    };

    // Envía los datos al servidor mediante AJAX
    $.ajax({
        url: agregarAveria,
        type: 'POST',
        headers: { "X-CSRFToken": getCookie("csrftoken") },
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function(response) {
            console.log('Respuesta del servidor:', response);
            // Una vez que se completa el envío de datos de tabla, envía el id_averia a la vista informe
            descargarInformeAveria(id_averia)
            
            
        },
        error: function(xhr, status, error) {
            console.error('Error en la solicitud AJAX:', error);
        }
    });
}

function descargarInformeAveria(id_averia) {
    // Crear una solicitud AJAX para obtener el archivo generado
    $.ajax({
        url: informe,  // Ajusta la URL según corresponda
        type: "POST",
        headers: { "X-CSRFToken": getCookie("csrftoken") },
        data: { id_averia: id_averia },
        xhrFields: {
            responseType: 'blob' // Indicar que la respuesta será un archivo binario
        },
        success: function(response, status, xhr) {
            // Crear un objeto URL a partir de la respuesta para generar un enlace de descarga
            var url = window.URL.createObjectURL(response);

            // Crear un enlace de descarga
            var a = document.createElement('a');
            a.href = url;
            a.download = `informe_averia_${id_averia}.pdf`; // Nombre del archivo
            document.body.appendChild(a);
            a.click(); // Simular un clic en el enlace para iniciar la descarga
            window.URL.revokeObjectURL(url); // Liberar el objeto URL
        },
        error: function(xhr, status, error) {
            console.error('Error al descargar el archivo:', error);
        }
    });
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
    
    function obtenerFechaActual() {
        // Obtener la fecha y hora actuales en UTC
        var fechaActual = new Date();
        
        // Obtener el desplazamiento horario en minutos desde UTC para la zona horaria de Colombia (UTC-5)
        var offsetColombia = -5 * 60;
        
        // Calcular la fecha y hora en la zona horaria de Colombia
        var fechaColombia = new Date(fechaActual.getTime() + offsetColombia * 60 * 1000);
        
        return fechaColombia;
    }