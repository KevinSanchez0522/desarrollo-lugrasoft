document.addEventListener("DOMContentLoaded", function() {
    var fechaCreacionInput = document.getElementById("fechaCreacion");
    var fechaActual = obtenerFechaActual();
    var fechaFormatoISO = fechaActual.toISOString().split('T')[0];
    fechaCreacionInput.value = fechaFormatoISO;
    fechaCreacionInput.setAttribute('readonly', 'readonly');
    const selectedProducts = new Set();
    const materiasPrimasRequeridas = {}; // Objeto para almacenar cantidades requeridas de materias primas
    const existenciasMateriasPrimas = {};
    const tabButtons = document.querySelectorAll(".tab-button");
    const tabContents = document.querySelectorAll(".tab-content");


    fechaCreacionInput.value = fechaFormatoISO;
    fechaCreacionInput.setAttribute('readonly', 'readonly');

    $('#producto').select2();
    $('#producto').on('change', function() {
        const selectedOption = $(this).find('option:selected');
        const productoId = $(this).val()
        const productoNombre = selectedOption.text().split('--')[1];
        console.log('producto seleccionado', selectedOption)
        console.log('productoid y opcion seleccionada',productoId, selectedOption)

        if (productoId && !selectedProducts.has(productoId)) {
            $.ajax({
                url: materiasprimas, // Actualiza esta URL según tu configuración
                data: { producto_id: productoId },
                success: function(response) {
                    if (response.success) {
                        const materiasPrimas = response.materias_primas;
                        console.log('materias primas', response.materias_primas)

                        selectedProducts.add(productoId);

                        // Actualizar cantidades requeridas de materias primas
                        materiasPrimas.forEach(mp => {
                            const codigoMP = mp.codigo;
                            const cantidadMP = mp.cantidad_requerida;
                            const nombreMP = mp.nombre;

                            if (materiasPrimasRequeridas[codigoMP]) {
                                // Si la materia prima ya está en el registro, sumar la cantidad requerida
                                materiasPrimasRequeridas[codigoMP] += cantidadMP;
                            } else {
                                // Si no está en el registro, asignar la cantidad requerida
                                materiasPrimasRequeridas[codigoMP] = cantidadMP;
                            }

                            // Actualizar existencias de materias primas
                            existenciasMateriasPrimas[codigoMP] = mp.cantidad_actual;
                        });

                        const newRow = $('<tr>');

                        const idCell = $('<td>').text(productoId);
                        const nombreCell = $('<td>').text(productoNombre);
                        const cantidadCell = $('<td>');
                        const cantidadInput = $('<input>').attr('type', 'number').addClass('cantidad-input').val(1);
                        cantidadCell.append(cantidadInput);

                        const opcionesCell = $('<td>');
                        const deleteButton = $('<button>').text('Eliminar').addClass('delete-btn');
                        deleteButton.on('click', function() {
                            newRow.remove();
                            selectedProducts.delete(productoId);
                            $('#producto option[value="' + productoId + '"]').prop('disabled', false);
                            updateInfoContainers(); // Actualizar al eliminar producto
                        });
                        opcionesCell.append(deleteButton);

                        newRow.attr({
                            'data-producto-id': productoId,
                            'data-producto-nombre': productoNombre
                        });
                        newRow.append(idCell, nombreCell, cantidadCell, opcionesCell);

                        $('#tabla-formulario tbody').append(newRow);
                        updateInfoContainers();

                        $('#producto option[value="' + productoId + '"]').prop('disabled', true);
                        $('#producto').val(null).trigger('change');

                    } else {
                        alert('Error: ' + response.error);
                    }
                },
                error: function() {
                    alert('Error al validar el producto.');
                }
            });
        }
    });

    $('#tabla-formulario').on('input', '.cantidad-input', function() {
        updateInfoContainers();
    });



    function mostrarPestanaActiva() {
        // Mostrar la pestaña de la tabla por defecto
        document.getElementById("tabla-content").classList.add("active");
        document.querySelector(".tab-button[data-tab='tabla-content']").classList.add("active");
    }

    tabButtons.forEach(button => {
        button.addEventListener("click", function() {
            // Ocultar todas las pestañas y desactivar botones
            tabButtons.forEach(btn => btn.classList.remove("active"));
            tabContents.forEach(content => content.classList.remove("active"));

            // Mostrar la pestaña correspondiente al botón clickeado
            const tabId = this.getAttribute("data-tab");
            document.getElementById(tabId).classList.add("active");
            this.classList.add("active");
        });
    });

    mostrarPestanaActiva();

    fechaCreacionInput.value = fechaFormatoISO;
    fechaCreacionInput.setAttribute('readonly', 'readonly');





    


    function updateInfoContainers() {
        // Reiniciar el objeto de cantidades requeridas de materias primas
        const materiasPrimasRequeridas = {};
        // Variable para verificar si hay inventario insuficiente
        let inventarioInsuficiente = false;
    
        // Iterar sobre todas las filas de la tabla
        $('#tabla-formulario tbody tr').each(function() {
            const productoId = $(this).data('productoId');
            const cantidad = $(this).find('.cantidad-input').val() || 1; // Si no hay cantidad, se asume 1
    
            // Actualizar cantidades requeridas de materias primas para este producto
            $.ajax({
                url: materiasprimas, // Asegúrate de que esta URL coincide con tu configuración de Django
                data: { producto_id: productoId },
                async: false, // Hacer la solicitud de manera sincrónica para garantizar el orden de ejecución
                success: function(response) {
                    if (response.success) {
                        const materiasPrimas = response.materias_primas;
    
                        materiasPrimas.forEach(mp => {
                            const codigoMP = mp.codigo;
                            const cantidadRequerida = mp.cantidad_requerida * cantidad;
                            const nombreMP = mp.nombre;

                            // Verificar si la cantidad requerida es mayor que la cantidad en inventario
                            if (cantidadRequerida > (existenciasMateriasPrimas[codigoMP] || 0)) {
                                inventarioInsuficiente = true;
                            }
    
                            if (materiasPrimasRequeridas[codigoMP]) {
                                // Si la materia prima ya está en el registro, sumar la cantidad requerida
                                materiasPrimasRequeridas[codigoMP].cantidad += cantidadRequerida;
                            } else {
                                // Si no está en el registro, asignar la cantidad requerida
                                materiasPrimasRequeridas[codigoMP] = {
                                    cantidad: cantidadRequerida,
                                    nombre: nombreMP
                                };
                            }
                            existenciasMateriasPrimas[codigoMP] = mp.cantidad_actual;
                        });
    
                    } else {
                        alert('Error: ' + response.error);
                    }
                },
                error: function() {
                    alert('Error al validar el producto.');
                }
            });
        });
         // Mostrar alerta si hay inventario insuficiente
        if (inventarioInsuficiente) {
            const confirmacion = confirm('Existen materias primas con cantidades requeridas mayores que las disponibles en inventario. ¿Deseas continuar?');
            if (!confirmacion) {
                return false; // Cancelar el envío de datos
            }
        }
    
        actualizarVisualizacionMateriasPrimasRequeridas(materiasPrimasRequeridas);
    }


    function actualizarVisualizacionMateriasPrimasRequeridas(materiasPrimasRequeridas) {
        const tableBody = $('#materias-primas-table tbody');
        tableBody.empty(); // Limpiar filas existentes
        
        Object.keys(materiasPrimasRequeridas).forEach(codigoMP => {
            const { cantidad, nombre } = materiasPrimasRequeridas[codigoMP];
            const cantidadEnInventario = existenciasMateriasPrimas[codigoMP] || 0; // Si no hay cantidad en inventario, se asume 0
            
            
            const rowHtml = `<tr>
                                <td>${codigoMP}</td>
                                <td>${nombre}</td>
                                <td>${cantidad}</td>
                                <td>${cantidadEnInventario}</td>
                            </tr>`;

            // Agregar la fila a la tabla
            tableBody.append(rowHtml);

            // Obtener la fila recién agregada para resaltarla si es necesario
            const newRow = tableBody.find('tr:last');

            // Verificar si la cantidad requerida es mayor que la cantidad en inventario
            if (cantidad > cantidadEnInventario) {
                newRow.addClass('inventario-insuficiente');
            } else {
                newRow.removeClass('inventario-insuficiente');
            }
        });
    }

    $('#enviarFormularioBtn').on('click', function() {
        // Validar que todos los campos necesarios estén completos
        //if (!validarCampos()) {
            //alert('Por favor completa todos los campos obligatorios.');
            //return false; // Cancelar el envío del formulario si faltan datos
        //}


            var nombreResponsable = $('#Responsable option:selected');
            var prioridadSeleccionada = $('#prioridad').val();
            var numeroFactura = $('#numeroFactura').val();
            var fechaActual = $('#fechaCreacion').val();
            var fechaEstimada = $('#fechaEntrega').val();
            var prioridad = $('#prioridad').val();
            var idCliente = $('#id_cliente').val();
            var responsable = $('#Responsable').val();

        // Array para almacenar los detalles de productos
            var detallesProductos = [];
    
            // Recorrer todas las filas de la tabla
            $('#tabla-formulario tbody tr').each(function() {
                var productoId = $(this).data('productoId');
                var cantidad = $(this).find('.cantidad-input').val() || 1; // Valor por defecto 1 si no hay cantidad
    
                // Agregar cada detalle de producto al array
                detallesProductos.push({
                    producto_id: productoId,
                    cantidad: cantidad
                });
                });
    
                // Objeto con todos los datos a enviar
                var datosEnviar = {
                    numero_factura: numeroFactura,
                    fecha_actual: fechaActual,
                    fecha_estimada_entrega: fechaEstimada,
                    prioridad: prioridad,
                    id_cliente: idCliente,
                    responsable: responsable,
                    detallesProductos : detallesProductos,
                };
        
                // Imprimir todos los datos en la consola del navegador (opcional)
                console.log('Datos a enviar:', datosEnviar);
                console.log('Número de Factura:', numeroFactura);
                console.log('Fecha Actual:', fechaActual);
                console.log('Fecha Estimada de Entrega:', fechaEstimada);
                console.log('Prioridad:', prioridadSeleccionada);
                console.log('ID del Cliente:', idCliente);
                console.log('Detalles de Productos:');
                console.log(detallesProductos);
                console.log('Responsable:', nombreResponsable);
                var confirmacion = confirm("¿Estás seguro de que deseas enviar los datos?");

        // Verificar la respuesta del usuario
                if (confirmacion) {
                    var csrftoken = getCookie('csrftoken');
        
                // Enviar los datos mediante AJAX a la vista de Django
                $.ajax({
                    url: remontarPedido,  // Reemplaza con la URL correcta de tu vista en Django
                    method: 'POST',
                    headers: { "X-CSRFToken": csrftoken },
                    contentType: 'application/json',
                    data: JSON.stringify(datosEnviar),  // Convertir datosEnviar a JSON
                    success: function(response) {
                        // Manejar la respuesta de la vista si es necesario
                        alert('Datos almacenados correctamente.');
                        location.reload(); 
                    },
                    error: function(xhr, status, error) {
                        alert('Error al almacenar los datos: ' + error);
                    }
                });
                } else {
                // Cancelar el envío de datos si el usuario cancela la confirmación
                return false;
                }
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

function validarCampos() {
    // Verificar que todos los campos obligatorios estén completos
    var camposCompletos = true;

    // Ejemplo de validación para campos obligatorios, ajusta según tu formulario
    if ($('#numeroFactura').val() === '') {
        camposCompletos = false;
    }

    if ($('#fechaCreacion').val() === '') {
        camposCompletos = false;
    }

    if ($('#fechaEntrega').val() === '') {
        camposCompletos = false;
    }

    if ($('#id_cliente').val() === '') {
        camposCompletos = false;
    }

    if ($('#Responsable').val() === '') {
        camposCompletos = false;
    }

    // Aquí puedes agregar más validaciones según los campos necesarios

    return camposCompletos;
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

function confirmarEnvio() {
    var confirmacion = confirm("¿Estás seguro de que deseas enviar los datos?");
    if (!confirmacion) {
        // Si el usuario cancela, evitamos que el formulario se envíe
        return false;
    }
    // Aquí puedes agregar lógica adicional si necesitas validar que el cliente no exista.
    return true; // Si el usuario confirma, enviamos el formulario
}