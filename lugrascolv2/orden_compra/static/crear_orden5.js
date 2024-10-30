document.addEventListener("DOMContentLoaded", function() {
    $('#producto').select2();
    $('#proveedor').select2();
    // Obtener el campo de fecha
    var fechaCreacionInput = document.getElementById("fechaCreacion");
    // Obtener la fecha actual
    var fechaActual = obtenerFechaActual();
    // Formatear la fecha actual como YYYY-MM-DD
    var fechaFormatoISO = fechaActual.toISOString().split('T')[0];
    // Establecer la fecha por defecto en el campo de fecha
    fechaCreacionInput.value = fechaFormatoISO;
    fechaCreacionInput.setAttribute('readonly', 'readonly');

    
    var productoSelector = document.getElementById("producto");
    var tablaFormulario = document.getElementById("tabla-formulario").getElementsByTagName('tbody')[0];
    var enviarFormularioBtn = document.getElementById("enviarFormularioBtn");
    var divTotalFactura = document.getElementById("totalFactura");
    
    
    
    
// Evento change del selector #proveedor
$('#proveedor').on('change', function() {
    // Limpiar y actualizar información del proveedor seleccionado
    var proveedorId = $(this).val();
    var direccion = $('#proveedor option:selected').attr('data-direc');
    var telefono = $('#proveedor option:selected').attr('data-tel');
    
    $('#nitproveedor').text(proveedorId);
    $('#direccion').text(direccion);
    $('#telefono').text(telefono);
    
    // Actualizar atributo data-proveedor-id del selector #producto
    $('#producto').attr('data-proveedor-id', proveedorId);
    // Deshabilitar el selector de proveedores después de seleccionar uno
    $('#proveedor').prop('disabled', true);
    // Si se ha seleccionado un proveedor válido, cargar los productos en el selector
    if (proveedorId) {
        $.ajax({
            url: obtenerProductosURL, // URL para obtener los productos por proveedor
            method: "GET",
            data: { proveedor_id: proveedorId },
            dataType: "json",
            success: function(data) {
                // Limpiar opciones actuales del selector de productos
                $('#producto').empty();
                
                // Agregar opción inicial
                $('#producto').append('<option value="">Producto</option>');
                
                // Agregar opciones de productos obtenidos
                data.forEach(function(producto) {
                    var optionText = producto.id + '-' + producto.nombre;
                    var option = new Option(optionText, producto.id, false, false);
                    $(option).data('id', producto.id);
                    $('#producto').append(option);
                });
                
                // Restablecer el selector de productos (Select2) después de actualizar las opciones
                $('#producto').select2();
            },
            error: function(xhr, textStatus, errorThrown) {
                console.error('Error al obtener los productos: ' + errorThrown);
            }
        });
    } else {
        // Si no se selecciona ningún proveedor válido, limpiar el selector de productos
        $('#producto').empty().append('<option value="">Producto</option>').select2();
    }
});

// Evento change del selector #producto (Select2)
$('#producto').on('change', function() {
    // Verificar si se ha ingresado el número de factura
    var numeroFactura = $('#numeroFactura').val().trim();
    if (numeroFactura === '') {
        alert("Por favor, ingrese el número de factura antes de seleccionar un producto.");
        return; // Detener el proceso si el número de factura no está ingresado
    }
    // Obtener datos del producto seleccionado
    var productoSeleccionado = $(this).select2('data')[0];
    
    // Validar si se ha seleccionado un producto válido
    if (productoSeleccionado) {
        var id_producto = productoSeleccionado.id;
        var nombre_producto = $(this).find('option:selected').text();
        var id_proveedor = $(this).attr('data-proveedor-id');
        var fechaCreacion = document.getElementById("fechaCreacion").value; 
        var numeroFactura = document.getElementById("numeroFactura").value; // Obtener número de factura

        console.log("ID del producto seleccionado:", id_producto);
        console.log("Nombre del producto seleccionado:", nombre_producto);
        console.log("ID del proveedor del producto:", id_proveedor);
        
        // Crear una nueva fila en la tabla
        var nuevaFila = tablaFormulario.insertRow();
        nuevaFila.insertCell().textContent = id_producto; // ID del producto
        nuevaFila.insertCell().textContent = nombre_producto; // Nombre del producto
        nuevaFila.insertCell().contentEditable = true; // Cantidad (editable)
        nuevaFila.insertCell().contentEditable = true; // Precio (editable)
        nuevaFila.insertCell().textContent = "0"; // Total inicializado en 0
        nuevaFila.insertCell().textContent = fechaCreacion; // Fecha de creación
        var celdaUnidad = nuevaFila.insertCell();
        var selectUnidad = document.createElement('select');
        selectUnidad.innerHTML ='<option value="Unidad">Unidad</option>' +
                                '<option value="Galon">Galon</option>' +
                                '<option value="Kg">Kg</option>' +
                                '<option value="Gr">Gr</option>';
        celdaUnidad.appendChild(selectUnidad);
        nuevaFila.insertCell().textContent = id_proveedor; // ID del proveedor
        // Celda para el número de factura (suponiendo que 'numeroFactura' está definido)
        nuevaFila.insertCell().textContent = numeroFactura;
        // Celda para el icono de borrado
        var celdaBorrar = nuevaFila.insertCell();
        var iconoBorrar = document.createElement('i');
        iconoBorrar.classList.add('bi', 'bi-trash');
        celdaBorrar.appendChild(iconoBorrar);
        
        // Evento para manejar la eliminación de la fila
        iconoBorrar.addEventListener('click', function() {
            var filaParaEliminar = this.closest('tr');
            filaParaEliminar.remove();
            actualizarTotalFactura();
        });
        
        // Función para calcular el total de la fila
        function actualizarTotal() {
            var fila = this.parentNode;
            var celdaCantidad = parseFloat(fila.cells[2].textContent);
            var celdaPrecio = parseFloat(fila.cells[3].textContent);
            var celdaTotal = fila.cells[4];
            
            // Calcular el total y actualizar la celda correspondiente
            var total = celdaCantidad * celdaPrecio;
            celdaTotal.textContent = total.toFixed(2);
            
            // Actualizar el total de la factura
            actualizarTotalFactura();
        }
        
        // Asignar eventos onblur para calcular y actualizar el total
        nuevaFila.cells[2].onblur = actualizarTotal;
        nuevaFila.cells[3].onblur = actualizarTotal;
        
        // Calcular y mostrar el total inicial de la factura
        actualizarTotalFactura();
    }
});
function actualizarTotalFactura() {
    var totalFactura = 0;
    var filas = tablaFormulario.rows;
    for (var i = 0; i < filas.length; i++) {
        var celdaTotal = parseFloat(filas[i].cells[4].textContent);
        totalFactura += isNaN(celdaTotal) ? 0 : celdaTotal; // Ignorar celdas vacías o no numéricas
    }
    // Mostrar el total de la factura dentro del div de total factura
    divTotalFactura.textContent = "Total de la factura: $" + totalFactura.toLocaleString('es-ES', {minimumFractionDigits: 2});
}


    


    var enviarFormularioBtn = document.getElementById("enviarFormularioBtn");
    enviarFormularioBtn.addEventListener("click", function() {
        var confirmacion = confirm("¿Estás seguro de que deseas enviar la información?");
        if (confirmacion) {
            var datosTabla = [];
            var totalFactura = 0; // Variable para almacenar el valor total de la tabla
            var filas = tablaFormulario.rows;
            for (var i = 0; i < filas.length; i++) {
            var fila = filas[i];
            var celdas = fila.cells;
        // Verificar que la fila tenga las celdas esperadas antes de acceder a sus contenidos
                if (celdas.length >= 7) {
                    var id_producto = celdas[0].textContent;
                    var nombre = celdas[1].textContent;
                    var cantidad = parseFloat(celdas[2].textContent);
                    var precioUnitario = parseFloat(celdas[3].textContent);
                    var celdaTotal = parseFloat(celdas[4].textContent);
                    var fechaCreacion = celdas[5].textContent;
                    var unidad = celdas[6].querySelector('select').value; 
                    var idProveedor = celdas[7].textContent;
                    var numeroFactura = celdas[8].textContent;  
                    var recibido = false; // Inicializar recibido como false
                    var filaDatos = {
                        
                        idProducto: id_producto,
                        nombreProducto: nombre,
                        cantidad: cantidad,
                        precioUnitario: precioUnitario,
                        totalFila: celdaTotal,
                        fechaCreacion: fechaCreacion,
                        idProveedor: idProveedor, // Incluir id_proveedor
                        valorUnidad: unidad,
                        factura : numeroFactura,
                        recibido : recibido,
                        
                    };
                totalFactura += celdaTotal;
                datosTabla.push(filaDatos);
            } else {
                console.error("La fila", i, "no tiene las celdas esperadas.");
            }
        }
        var datosFormulario = JSON.stringify(datosTabla);
        divTotalFactura.textContent = "Total de la factura: $" + totalFactura.toFixed(2);
    }
        // Enviar los datos al servidor usando AJAX
        $.ajax({
            url: nuevaOrden, // Asegúrate que esta URL se renderiza correctamente en la plantilla
            method: "POST",
            headers: { "X-CSRFToken": getCookie("csrftoken") },
            contentType: 'application/json',
            data: JSON.stringify({datos_tabla: datosTabla, totalFactura: totalFactura}),
            success: function(response) {
                console.log(datosTabla)
                console.log("Datos enviados correctamente: ", response);
                limpiarModal();
                alert("Datos guardados correctamente.");
            },
            error: function(xhr, textStatus, errorThrown) {
                console.log('Error en la solicitud AJAX: ' + textStatus);
                alert("Error al enviar los datos. Por favor, intenta de nuevo.");
            }
        });
    });
    var addprovBtn = document.getElementById("addprov");
    var modal = document.getElementById("miModal");
    var modal2 = document.getElementById("miModal2")
    var addprod = document.getElementById("addprod")
    var form = document.getElementById("miModal").querySelector("form");
    var formulario = document.getElementById("formulario");

    // Obtener el elemento <span> que cierra la ventana modal
    var span = document.getElementsByClassName("close")[0];
    var span2 = document.getElementsByClassName("closemodal2")[0];
    
    // Cuando el usuario haga clic en el botón "Addprov", abrir la ventana modal
    addprovBtn.onclick = function() {
        modal.style.display = "block";
    }
    addprod.onclick = function() {
        modal2.style.display = "block";
    }
    
    // Cuando el usuario haga clic en <span> (x), cerrar la ventana modal
    span.onclick = function() {
        modal.style.display = "none";
    }
    span2.onclick = function() {
        modal2.style.display = "none";
    }
    
    // Cuando el usuario haga clic fuera del contenido de la ventana modal, cerrarla
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
        if (event.target == modal2) {
            modal2.style.display = "none";
        }
    }

    form.addEventListener("submit", function(event) {
        // Mostrar una confirmación antes de enviar los datos
        var confirmacion = confirm("¿Estás seguro de que deseas enviar los datos?");
        if (!confirmacion) {
            // Cancelar el envío del formulario si el usuario cancela
            event.preventDefault();
        } else {
            // Verificar si el proveedor ya existe
            var nit = document.getElementById('nit').value;
            if (Proveedores.objects.filter(id_proveedor=nit).exists()) {
                // Mostrar una alerta indicando que el proveedor ya existe
                alert("¡El proveedor con este NIT ya existe en la base de datos!");
                // Detener el envío del formulario
                event.preventDefault();
            }
        }
    });
    // Agregar evento al enviar el formulario
    formulario.addEventListener("submit", function(event) {
        // Modificar los valores antes de enviar el formulario
        document.getElementById("cant").value = "0"; // Establecer cantidad en 0
        document.getElementById("costo_unitario").value = "0"; // Establecer costo unitario en 0
        document.getElementById("id_compra").value = "0"; // Dejar id_compra vacío

        // Aquí puedes agregar más modificaciones según tus necesidades

        // Continuar con el envío del formulario
        return true;
    });
});

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

function limpiarModal() {
// Resetear el select de proveedores
$('#proveedor').val($('#proveedor option:first').val());

// Limpiar información del proveedor
$('#nitproveedor').text('NIT');
$('#direccion').text('DIRECCION');
$('#telefono').text('TELEFONO');


// Resetear el select de productos
$('#producto').html('<option value="">Producto</option>');

// Limpiar la tabla, manteniendo solo la cabecera
$('#tabla-formulario tbody').empty();

$('#numeroFactura').val('');
}
// Escuchar el evento de cambio en el selector
// Obtener referencia al botón de cerrar modal

function calcularTotalFactura() {
    var tablaFormulario = document.getElementById("tabla-formulario").getElementsByTagName('tbody')[0];
    var totalFactura = 0;
    var filas = tablaFormulario.rows;
    for (var i = 0; i < filas.length; i++) {
        var celdas = filas[i].cells;
        if (celdas.length >= 5) { // Ajusta esto según la cantidad de celdas que contengan el precio total
            var celdaTotal = parseFloat(celdas[4].textContent);
            if (!isNaN(celdaTotal)) {
                totalFactura += celdaTotal;
            }
        }
    }
    return totalFactura;
}

            // Función para mostrar una alerta de confirmación antes de enviar el formulario
            function confirmarEnvio() {
                // Obtener los valores del formulario
            var nit = document.getElementById('nit').value;
            var nombre = document.getElementById('nombreproveedor').value;
            var direccion = document.getElementById('direccion').value;
            var telefono = document.getElementById('telefono').value;
                    
                            // Construir el mensaje de confirmación con los datos del formulario
            var mensaje = "Por favor, confirme los siguientes datos:\n";
            mensaje += "NIT: " + nit + "\n";
            mensaje += "Nombre: " + nombre + "\n";
            mensaje += "Dirección: " + direccion + "\n";
            mensaje += "Teléfono: " + telefono + "\n";
                    
                // Mostrar una alerta de confirmación con los datos del formulario
            if (confirm(mensaje)) {
                // Enviar el formulario si el usuario confirma
                return true;
            } else {
                // Cancelar el envío del formulario si el usuario cancela
                return false;
            }
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



        function actualizarTotal() {
            var fila = this.parentNode;
            var celdaCantidad = fila.cells[2];
            var celdaPrecio = fila.cells[3];
            var celdaTotal = fila.cells[4];

            var cantidad = parseFloat(celdaCantidad.textContent);
            var precioUnitario = parseFloat(celdaPrecio.textContent);
            celdaTotal.textContent = (cantidad * precioUnitario).toFixed(2);

            // Calcular y actualizar el total de la factura
            actualizarTotalFactura();
        }
