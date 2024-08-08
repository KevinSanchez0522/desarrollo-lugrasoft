document.addEventListener('DOMContentLoaded', function() {
    $(document).ready(function() {
        $('#filtro').select2();
        
        });
    
    var tabla = document.getElementById('tabla-formulario');
    var filas = tabla.getElementsByTagName('tr');

    $('#filtro').on('change', function() {
        var valorSeleccionado = this.value;

        // Quitar la clase de resaltado de todas las filas
        for (var i = 1; i < filas.length; i++) {
            filas[i].classList.remove('highlight');
            var celdaFactura = filas[i].getElementsByTagName('td')[0];

            if (celdaFactura) {
                var numeroFactura = celdaFactura.textContent || celdaFactura.innerText;

                if (valorSeleccionado === "" || numeroFactura === valorSeleccionado) {
                    filas[i].style.display = '';
                    if (numeroFactura === valorSeleccionado) {
                        filas[i].classList.add('highlight'); // Añadir clase de resaltado
                    }
                } else {
                    filas[i].style.display = 'none';
                }
            }
        }
    });

// apertura del modal 

    var modal = document.getElementById("modalDetalleOrden");

    // Obtener el enlace de vista
    var viewLinks = document.querySelectorAll('.view');

    // Obtener el elemento de cierre
    var span = document.getElementsByClassName("close")[0];

    // Función para abrir el modal y cargar contenido
    function openModal(facturaId) {
        // Aquí puedes cargar contenido dinámico basado en `facturaId`
        // Por ejemplo, hacer una solicitud AJAX para obtener detalles de la factura
        document.getElementById('detalleContenido').textContent = 'Cargando detalles para la factura ' + facturaId;

        // Mostrar el modal
        modal.style.display = "block";

        // Aquí se hace la solicitud AJAX para obtener los detalles de la factura
        $.ajax({
            url: obtenerDetallesFacturacion,  // Reemplaza con la URL correcta de tu backend
            type: 'GET',
            data: {
                factura_id: facturaId
            },
            success: function(response) {
                var tbody = $('#tabla-formulario-modal tbody');
                tbody.empty(); // Limpiar el contenido previo
            
                // Verificar si hay productos en la respuesta
                if (response.productos && response.productos.length > 0) {
                    response.productos.forEach(function(producto) {
                        var fila = '<tr>' +
                                    '<td>' + producto.cod_inventario + '</td>' +
                                    '<td>' + producto.nombre + '</td>' +
                                    '<td>' + producto.cantidad + '</td>' +
                                    '<td>$ ' + (producto.precio_unitario || 'N/A') + '</td>' +
                                    '</tr>';
                        tbody.append(fila);
                    });
                } else {
                    // Si no hay productos, agregar una fila con un mensaje
                    var fila = '<tr><td colspan="5">No se encontraron productos para esta factura.</td></tr>';
                    tbody.append(fila);
                }
                },
            error: function(xhr, status, error) {
                
                console.error('Error en la solicitud AJAX:', status, error);
            }
        });
    }

    // Añadir evento click a cada enlace de vista
    viewLinks.forEach(function(link) {
        link.addEventListener('click', function(event) {
            event.preventDefault(); // Evitar el comportamiento por defecto del enlace

            // Obtener el número de factura desde el elemento de la fila
            var facturaId = this.closest('tr').querySelector('td').textContent.trim();

            // Abrir el modal con el ID de la factura
            openModal(facturaId);
        });
    });

    // Añadir evento click al botón de cerrar
    span.onclick = function() {
        modal.style.display = "none";
    }

    // Añadir evento click al área fuera del modal para cerrarlo
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
// fin apertura del modal 
});