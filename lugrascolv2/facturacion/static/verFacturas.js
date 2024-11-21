document.addEventListener('DOMContentLoaded', function() {
    $(document).ready(function() {
        $('#filtro').select2();
        
        });

        
        $('.cancel').on('click', function(event) {
            event.preventDefault(); // Prevenir el comportamiento por defecto del enlace
            
            var url = $(this).attr('href'); // Obtener la URL del enlace
            
            // Mostrar un cuadro de confirmación
            var confirmar = confirm('¿Está seguro de que desea anular esta factura?');
            
            if (confirmar) {
                // Si el usuario confirma, realizar una solicitud AJAX para procesar la anulación
                $.ajax({
                    url: url,
                    type: 'POST',
                    headers: {
                        'X-CSRFToken': getCookie('csrftoken') // Asegúrate de que el token CSRF está incluido
                    },
                    success: function(response) {
                        // Cambiar el icono de anulación en la página
                        
                        
                        // Mostrar un mensaje de éxito o redirigir a otra página
                        alert('Factura anulada exitosamente');
                        
                        // Opcionalmente, recargar la página para ver los cambios reflejados
                        location.reload();
                    },
                    error: function(xhr, status, error) {
                        // Manejo de errores
                        console.error('Error al anular la factura:', error);
                    }
                });
            } else {
                console.log('Anulación cancelada');
            }
        });
    
        $('.disabled').on('click', function(event) {
            event.preventDefault(); // Prevenir el comportamiento por defecto del enlace
            alert('LA FACTURA HA SIDO ANULADA')
        });
        $('.noEdit').on('click', function(event) {
            event.preventDefault(); // Prevenir el comportamiento por defecto del enlace
            alert('NO PUEDE EDITAR, LA FACTURA ESTA ANULADA')
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
                        $('.ICA').text('$' + '' + producto.ica);

                        
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




$('.BuscarFecha').on('click',function(){
    var fechaInicio = $('#fecha_inicio').val();
    var fechaFin = $('#fecha_fin').val();

    if (!fechaInicio || !fechaFin) {
        alert('Por favor, ingrese ambas fechas.');
        return;
    }
    $.ajax({
        url: buscarFecha,
        method: 'GET',
        data: {
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin
        },
        success: function(response) {
            console.log('Facturas filtradas:', response.facturas);
            actualizarTabla(response.facturas);
        },
        error: function(xhr, status, error){
            console.log('error en la solicitud AJAX: ', status, error);
        }
    });
})
function inicializarEventos() {

    $('#tabla-formulario').off('click', '.view');
    $('#tabla-formulario').off('click', '.cancel');
    // Manejar clic en los enlaces de vista
    $('#tabla-formulario').on('click', '.view', function(e) {
        e.preventDefault();
        var facturaId = $(this).data('id')
        console.log('factura: ',  facturaId)
        // Aquí abre el modal y carga la información de la factura
        openModal(facturaId);
    
    });

    $('#tabla-formulario').on('click', '.cancel', function(e) {
        e.preventDefault(); // Prevenir el comportamiento por defecto del enlace
        
        var url = $(this).attr('href'); // Obtener la URL del enlace

        if (!url.endsWith('/')) {
            url += '/';
        }
        
        // Mostrar un cuadro de confirmación
        var confirmar = confirm('¿Está seguro de que desea anular esta factura?');
        
        if (confirmar) {
            // Si el usuario confirma, realizar una solicitud AJAX para procesar la anulación
            $.ajax({
                url: url,
                type: 'POST',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken') // Asegúrate de que el token CSRF está incluido
                },
                success: function(response) {
                    // Mostrar un mensaje de éxito o redirigir a otra página
                    alert('Factura anulada exitosamente');
                    
                    // Opcionalmente, recargar la página para ver los cambios reflejados
                    location.reload();
                },
                error: function(xhr, status, error) {
                    // Manejo de errores
                    console.error('Error al anular la factura:', error);
                }
            });
        } else {
            console.log('Anulación cancelada');
        }
    });
}

function actualizarTabla(facturas) {
    var tbody = $('#tabla-formulario tbody');
    tbody.empty(); // Limpiar el tbody antes de agregar nuevas filas

    var editar = '/facturacion/editarFactura/';
    var anular = '/facturacion/anular/';

    // Agregar filas a la tabla
    $.each(facturas, function(index, factura) {
        var fila = '<tr>' +
            '<td>' + factura.nfactura + '</td>' +
            '<td>' + factura.nombreCliente + '</td>' +
            '<td>$ ' + factura.total_factura_formateado + '</td>' +
            '<td>' + factura.fecha_facturacion + '</td>' +
            '<td>' +
            '<a href="" data-id="' + factura.nfactura +'" class="view" title="Ver Factura"><i class="bi bi-eye"></i></a>' +
            (factura.facturaAnulada ? 
                '<a href="#" class="noEdit" title="No puede Editar"><i class="bi bi-clipboard2-x"></i></a>' :
                '<a href="'+ editar + factura.nfactura +'" class="edit" title="Editar Factura"><i class="bi bi-pencil"></i></a>'
            ) +
            (factura.facturaAnulada ? 
                '<a href="#" class="disabled" title="Factura Anulada"><i class="bi bi-folder-x"></i></a>' :
                '<a href="'+ anular + factura.nfactura +'" class="cancel" title="Anular Factura"><i class="bi bi-x-octagon"></i></a>'
            ) +
            '</td>' +
            '</tr>';

        tbody.append(fila);
         // Re-inicializar los eventos después de agregar nuevas filas
        inicializarEventos();
    });
}
});





function abrirModal(facturaId) {
    // Implementa la lógica para abrir y cargar el modal aquí
    console.log('Abriendo modal para factura ID:', facturaId);
    // Ejemplo: Cargar datos y mostrar el modal
}

function printModal() {
    var botonImprimir  = document.querySelector('.invoice-footer button');
    var closeButton = document.getElementById('closeButton');
    botonImprimir.style.display = 'none';
    closeButton.style.display = 'none';
    var printWindow = window.open('', '', 'height=600,width=800');
    var modalContent = document.querySelector('#modalDetalleOrden .modal-content').innerHTML;
    
    // Ruta al archivo CSS
    var cssLink = imprimir

    var styles = `<style>
                    @media print {
                        body {
                            margin: 0;
                            font-family: Arial, sans-serif; /* Fuente común para evitar variaciones */
                            font-size: 12pt; /* Tamaño de fuente fijo */
                        }

                        .modal-content {
                            margin-top: 4cm; /* Margen superior de 4 cm */
                            padding: 20px; /* Padding para separar contenido */
                            background-color: #fff; /* Fondo blanco */
                            border: 1px solid #000; /* Borde alrededor del contenido */
                        }

                        /* Ocultar pie de página y otros elementos si no se desean imprimir */
                        .invoice-footer, #closeButton {
                            display: none;
                        }

                        /* Ajuste de desbordamiento y salto de línea */
                        .modal-content {
                            word-wrap: break-word;
                            overflow-wrap: break-word;
                            max-width: 100%; /* Asegura que el contenido no se desborde */
                        }
                    }
                </style>
            `;

    printWindow.document.write('<html><head><title>facturación lugrascol SAS </title>');
    printWindow.document.write('<link rel="stylesheet" href="' + cssLink + '">');
    printWindow.document.write(styles);
    printWindow.document.write('<style>');
    printWindow.document.write('body { margin-top: 4cm; }'); // Aplica margen superior de 4 cm
    printWindow.document.write('</style>');
    printWindow.document.write('</head><body >');
    printWindow.document.write(modalContent);
    printWindow.document.write('</body></html>');

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
}
function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}