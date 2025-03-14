var nombresProductos = [];
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
            url: obtenerDetallesFacturacion,  
            type: 'GET',
            data: {
                factura_id: facturaId
            },
            success: function(response) {
                var tbody = $('#tabla-formulario-modal tbody');
                tbody.empty(); // Limpiar el contenido previo
            
                let totalCantidad = 0;
                let totalPeso = 0;
                let pesofila=0;
                // Verificar si hay productos en la respuesta
                nombresProductos = []; 
                if (response.productos && response.productos.length > 0) {
                    response.productos.forEach(function(producto) {
                        nombresProductos.push(producto.nombre);
                        var fila = '<tr>' +
                                    '<td>' + producto.cantidad + ' '+'---'+' ' + producto.cod_inventario + ' ' + producto.nombre + '</td>' +
                                    '<td class="precio-unitario">'+ '$' + (producto.precio_unitario || 'N/A') + '</td>' +
                                    '</tr>';
                        tbody.append(fila);
                        var cantidad = parseFloat(producto.cantidad)
                        totalCantidad += cantidad;
                        console.log('peso', producto.peso)
                        pesofila= producto.peso * producto.cantidad
                        totalPeso += pesofila


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
                    var totalFila = '<tr>' +
                    '<td><strong>Total de Unidades:</strong></td>' +
                    '<td><strong>' + (totalCantidad % 1 === 0 ? totalCantidad.toFixed(0) : totalCantidad.toFixed(2)) + '</strong></td>' +
                    '</tr>';
                    tbody.append(totalFila);

                    var totalPesoproducto = '<tr>' +
                    '<td><strong>Total de Peso en KG:</strong></td>' +
                    '<td><strong>' + totalPeso.toFixed() + '</strong></td>' +
                    '</tr>';
                    tbody.append(totalPesoproducto);
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
    var secondModalContent = modalContent// Oculta la tabla en la segunda copia o elimina elementos dentro de la tabla si es necesario
    // Agregar la clase "second-modal" al contenido clonado
    //secondModalContent.classList.add('second-modal');
    var secondModalContent = `<div class="modal-content second-modal">${modalContent}</div>`;
    var hojaSeguridad = document.querySelector('.hoja').innerHTML;
    var hojaSeguridad = `<div class="hojaSeguridad tercera-hoja">${hojaSeguridad}</div>`;

    var hojaS = nombresProductos
    
    //Crear la lista de productos para la hoja de seguridad
    var productosHTML = '';
    hojaS.forEach(function(productoNombre) {
        productosHTML += `<li>${productoNombre}</li>`;
    });

    console.log('html',productosHTML)

    // Aquí buscamos el contenedor 'lista-productos' dentro de 'hojaSeguridad' y agregamos los productos
    var tempDiv = document.createElement('div');
    tempDiv.innerHTML = hojaSeguridad;  // Convertir el HTML de hojaSeguridad en un nodo DOM
    
    // Ahora encontramos el contenedor 'lista-productos' dentro de ese HTML temporal
    var listaProductosContainer = tempDiv.querySelector('.lista-productos');
    
    // Si el contenedor de productos existe, agregamos los productos a la lista
    if (listaProductosContainer) {
        listaProductosContainer.innerHTML = productosHTML;  // Insertar la lista generada
    }
    
    // Recuperar el HTML modificado de hojaSeguridad
    hojaSeguridad = tempDiv.innerHTML;

    



    modalContent = modalContent.replace(
        /<th class="precio">PRECIO UNITARIO<\/th>/g,  // Esto elimina el encabezado de la columna
        '' 
    );
    modalContent = modalContent.replace(
        /<td class="precio-unitario">[\s\S]*?<\/td>/g,  // Esto elimina todas las celdas con la clase 'precio'
        ''
    );
    
    // Ocultar o eliminar los elementos de valor IVA, valor total y ICA en la segunda copia
    modalContent = modalContent.replace(
        /<td class="valorIVA">[\s\S]*?<\/td>/g,  // Esto elimina el valor IVA
        '' 
    );
    modalContent = modalContent.replace(
        /<td class="valorTOTAL">[\s\S]*?<\/td>/g,  // Esto elimina el valor total
        '' 
    );
    modalContent = modalContent.replace(
        /<td class="ICA">[\s\S]*?<\/td>/g,  // Esto elimina el ICA
        ''
    );
    modalContent = modalContent.replace(
        /<td class="tasa">[\s\S]*?<\/td>/g,  // Esto elimina el ICA
        ''
    );
    modalContent = modalContent.replace(
        /<td class="valorSUBTOTAL">[\s\S]*?<\/td>/g,  // Esto elimina el ICA
        ''
    );
    // Ruta al archivo CSS
    var cssLink = imprimir
    


    var styles = `<style>
                    @media print {
                        body {
                            margin: 0;
                            font-family: Arial, sans-serif; /* Fuente común para evitar variaciones */
                            font-size: 12pt; /* Tamaño de fuente fijo */
                            margin-top:4cm;
                        }

                        .modal-content {
                            
                            margin-top: 4cm; /* Margen superior de 4 cm */
                            padding: 5px; /* Padding para separar contenido */
                            background-color: #fff; /* Fondo blanco */
                            font-size: 16px !important;
                            
                        }

                        .modal-content #tabla-formulario-modal{
                            font-size: 16px !important;
                        }
                        .second-modal {
                            page-break-before: always;
                            padding: 5px;
                            background-color: #fff;
                            
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


            setTimeout(function() {
                printWindow.document.write('<html><head><title>facturación lugrascol SAS </title>');
                printWindow.document.write('<link rel="stylesheet" href="' + cssLink + '">');
                printWindow.document.write(styles);
                printWindow.document.write('</head><body>');
                printWindow.document.write(modalContent); // Asegúrate de que modalContent no esté vacío
                printWindow.document.write('<hr>');
                printWindow.document.write(secondModalContent);
                printWindow.document.write('<hr>');
                printWindow.document.write(hojaSeguridad);
                printWindow.document.write('</body></html>');
            
                printWindow.document.close();
                printWindow.focus();
                printWindow.print();
            }, 100);
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