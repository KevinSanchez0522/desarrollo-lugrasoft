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
        document.getElementById('facturaN').textContent = 'N° de Factura:  ' + facturaId;

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
                                    '<td>' + producto.cantidad + ' '+'---'+' ' + producto.cod_inventario + ' ' + producto.nombre + '</td>' +
                                    '<td>'+ '$' + (producto.precio_unitario || 'N/A') + '</td>' +
                                    '</tr>';
                        tbody.append(fila);
                        $('.valorNit').text('N° de Cliente:  '+ producto.nit_cliente);
                        $('.nombreCliente').text(producto.nombre_cliente);
                        $('.direcCliente').text(producto.direccion_cliente);
                        $('.telCliente').text(producto.telefono_cliente);
                        $('.emailCliente').text(producto.correo_cliente);
                        $('.fecha').text('Fecha: ' + producto.fecha_factura);
                        $('.valorTOTAL').text('$'+ '' + producto.total_factura);
                        $('.valorIVA').text('$' + '' + producto.iva);

                        
                        $('.valorSUBTOTAL').text('$' + '' + producto.subtotal);
                        
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

function printModal() {
    var botonImprimir  = document.querySelector('.invoice-footer button');
    var closeButton = document.getElementById('closeButton');
    botonImprimir.style.display = 'none';
    closeButton.style.display = 'none';
    var printWindow = window.open('', '', 'height=600,width=800');
    var modalContent = document.querySelector('#modalDetalleOrden .modal-content').innerHTML;
    
    // Ruta al archivo CSS
    var cssLink = imprimir

    printWindow.document.write('<html><head><title>facturación lugrascol SAS </title>');
    printWindow.document.write('<link rel="stylesheet" href="' + cssLink + '">');
    printWindow.document.write('</head><body >');
    printWindow.document.write(modalContent);
    printWindow.document.write('</body></html>');

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
}
