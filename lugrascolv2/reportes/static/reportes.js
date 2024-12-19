// script.js
document.addEventListener('DOMContentLoaded', function() {

    cargarDatos();
    cargarDatosVentasDinamicas();
    cargarDatosCombinados();
    costeoInventario();


    // Cerrar el modal cuando se hace clic en el botón de cierre
    document.getElementById('closeButton').onclick = function() {
        var modal = document.getElementById('modalDetalleOrden');
        modal.style.display = "none";
    }

// Cerrar el modal si se hace clic fuera del contenido del modal
    window.onclick = function(event) {
        var modal = document.getElementById('modalDetalleOrden');
        if (event.target === modal) {
            modal.style.display = "none";
        }

    };


    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const targetPane = document.querySelector(targetId);

            // Remove 'active' class from all buttons and panes
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));

            // Add 'active' class to the clicked button and target pane
            this.classList.add('active');
            targetPane.classList.add('active');
        });
    });

    // Optionally, activate the first tab by default
    if (tabButtons.length > 0) {
        tabButtons[0].click();
    }




    $('.BuscarFechaVentas').on('click',function(){
        var fechaInicio = $('#fecha_inicioVentas').val();
        var fechaFin = $('#fecha_finVentas').val();
    
        if (!fechaInicio || !fechaFin) {
            alert('Por favor, ingrese ambas fechas.');
            return;
        }
        $.ajax({
            url: BuscarXFecha,
            method: 'GET',
            data: {
                fecha_inicio: fechaInicio,
                fecha_fin: fechaFin
            },
            success: function(response) {
                console.log('Facturas filtradas:', response.facturas);
                actualizarTabla(response.facturas);
                calcularTotalfiltrado(fechaInicio, fechaFin);
            },
            error: function(xhr, status, error){
                console.log('error en la solicitud AJAX: ', status, error);
            }
        });
    })

    $('.BuscarFechaVentasDinamicas').on('click',function(){
        var fechaInicio = $('#fecha_inicioVentasDinamicas').val();
        var fechaFin = $('#fecha_finVentasDinamicas').val();
    
        if (!fechaInicio || !fechaFin) {
            alert('Por favor, ingrese ambas fechas.');
            return;
        }
        $.ajax({
            url: BuscarXFecha,
            method: 'GET',
            data: {
                fecha_inicio: fechaInicio,
                fecha_fin: fechaFin
            },
            success: function(response) {
                console.log('Facturas filtradas:', response.facturas);
                actualizarTabla(response.facturas);
                calcularTotalfiltradoDinamicas(fechaInicio, fechaFin);
            },
            error: function(xhr, status, error){
                console.log('error en la solicitud AJAX: ', status, error);
            }
        });
    })

    $('.BuscarFechaVentasCombinadas').on('click',function(){
        var fechaInicio = $('#fecha_inicioVentasDinamicas').val();
        var fechaFin = $('#fecha_finVentasDinamicas').val();
    
        if (!fechaInicio || !fechaFin) {
            alert('Por favor, ingrese ambas fechas.');
            return;
        }
        $.ajax({
            url: BuscarXFecha,
            method: 'GET',
            data: {
                fecha_inicio: fechaInicio,
                fecha_fin: fechaFin
            },
            success: function(response) {
                console.log('Facturas filtradas:', response.facturas);
                actualizarTabla(response.facturas);
                calcularTotalfiltradoDinamicas(fechaInicio, fechaFin);
            },
            error: function(xhr, status, error){
                console.log('error en la solicitud AJAX: ', status, error);
            }
        });
    })



    function actualizarTabla(facturas) {
        var tbody = $('#tabla-formulario tbody');
        tbody.empty(); // Limpiar el tbody antes de agregar nuevas filas
    

    
        // Agregar filas a la tabla
        $.each(facturas, function(index, factura) {
            var fila = '<tr>' +
                '<td>' + factura.nfactura + '</td>' +
                '<td>' + factura.nombreCliente + '</td>' +
                '<td>$ ' + factura.total_factura_formateado + '</td>' +
                '<td>' + factura.fecha_facturacion + '</td>' +
                '</tr>';
            tbody.append(fila);
        });
    }



    // Referencias a los contenedores flotantes
    var floatingContainer = document.getElementById('floating-container');
    var floatingContainer1 = document.getElementById('floating-container1');
    var floatingContainer2 = document.getElementById('floating-container2');
    var floatingContainer3 = document.getElementById('floating-container3');

    // Referencias a los botones de minimizar
    var minimizeButton = document.getElementById('minimize-btn');
    var minimizeButton1 = document.getElementById('minimize-btn1');
    var minimizeButton2 = document.getElementById('minimize-btn2');
    var minimizeButton3 = document.getElementById('minimize-btn3');

    // Función para cambiar el icono y minimizar o expandir el contenedor
    function toggleMinimize(container, button) {
        container.classList.toggle('minimized');  // Cambia la clase 'minimized'

        // Cambiar el icono del botón
        if (container.classList.contains('minimized')) {
            button.innerHTML = '➕';  // Cambiar a "+" cuando se minimiza
        } else {
            button.innerHTML = '➖';  // Cambiar a "-" cuando se expande
        }
    }

    // Agregar eventos de clic a los botones de minimizar
    minimizeButton.addEventListener('click', function() {
        toggleMinimize(floatingContainer, minimizeButton);
    });

    minimizeButton1.addEventListener('click', function() {
        toggleMinimize(floatingContainer1, minimizeButton1);
    });

    minimizeButton2.addEventListener('click', function() {
        toggleMinimize(floatingContainer2, minimizeButton2);
    });

    minimizeButton3.addEventListener('click', function() {
        toggleMinimize(floatingContainer3, minimizeButton3);
    });




});

// calculos para los contenedores flotantes
function calcularTotalUltimaSemana() {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    // Convertir fechas a formato YYYY-MM-DD para comparar con las fechas de la tabla
    const todayStr = today.toISOString().split('T')[0];
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
    
    // Inicializar el total
    let total = 0;

    
    // Iterar sobre las filas de la tabla
    $('#tabla-formulario tbody tr').each(function() {

        
        // Obtener la fecha de la columna correspondiente (4ta columna en este caso)
        const fechaText = $(this).find('td').eq(3).text().trim();
        const totalFacturaStr = $(this).find('td').eq(2).text().trim().replace(/[$,]/g, '').trim();
        const totalFactura = parseFloat(totalFacturaStr);


        
        // Verificar si la fecha está en formato YYYY-MM-DD
        if (fechaText.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const fechaStr = fechaText; // Asumir que la fecha ya está en formato YYYY-MM-DD
            


            

            // Verificar si la fecha está dentro del rango de 7 días atrás hasta hoy
            if (fechaStr >= sevenDaysAgoStr && fechaStr <= todayStr) {
                total += totalFactura;
                
            }
        } else {
            console.error('Formato de fecha inválido:', fechaText);
        }
    });
    
    // Mostrar el total en el contenedor flotante
    document.getElementById('start-week').textContent = sevenDaysAgo.toISOString().split('T')[0];
    document.getElementById('current-day').textContent = today.toISOString().split('T')[0];
    document.getElementById('total-value').textContent = '$ ' + total.toLocaleString();
}
function calcularTotalUltimaSemanaVD() {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    // Convertir fechas a formato YYYY-MM-DD para comparar con las fechas de la tabla
    const todayStr = today.toISOString().split('T')[0];
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
    
    // Inicializar el total
    let total = 0;
    
    // Iterar sobre las filas de la tabla
    $('#tabla-formulario2 tbody tr').each(function() {

        
        // Obtener la fecha de la columna correspondiente (4ta columna en este caso)
        const fechaText = $(this).find('td').eq(3).text().trim();
        const totalFacturaStr = $(this).find('td').eq(2).text().trim().replace(/[$,]/g, '').trim();
        const totalFactura = parseFloat(totalFacturaStr);


        
        // Verificar si la fecha está en formato YYYY-MM-DD
        if (fechaText.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const fechaStr = fechaText; // Asumir que la fecha ya está en formato YYYY-MM-DD



            

            // Verificar si la fecha está dentro del rango de 7 días atrás hasta hoy
            if (fechaStr >= sevenDaysAgoStr && fechaStr <= todayStr) {
                total += totalFactura;
                
            }
        } else {
            console.error('Formato de fecha inválido:', fechaText);
        }
    });
    
    // Mostrar el total en el contenedor flotante
    document.getElementById('start-week2').textContent = sevenDaysAgo.toISOString().split('T')[0];
    document.getElementById('current-day2').textContent = today.toISOString().split('T')[0];
    document.getElementById('total-value2').textContent = '$ ' + total.toLocaleString();
}

function calcularTotalInventario() {
    // Inicializar el total
    let total = 0;
    
    // Iterar sobre las filas de la tabla
    $('#tabla-formulario4 tbody tr').each(function() {
        // Obtener el total de la columna correspondiente (4ta columna en este caso)
        const totalFilaStr = $(this).find('td').eq(4).text().trim().replace(/\./g, ''); // Eliminar puntos
        const totalFila = parseFloat(totalFilaStr.replace(/[$,]/g, ''));

        if (!isNaN(totalFila)) {
            total += totalFila;
        }
    });

    // Mostrar el total en el elemento con id 'total-value'
    document.getElementById('total-value4').textContent = '$ ' + total.toLocaleString();
}



function calcularTotalUltimaSemanaCombinada() {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);

    const todayStr = today.toISOString().split('T')[0];
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    let total = 0;


    $('#tabla-formulario3 tbody tr').each(function() {
        const fechaText = $(this).find('td').eq(3).text().trim();

        if (fechaText.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const fechaStr = fechaText;

            let totalFacturaStr = $(this).find('td').eq(2).text().trim();
            totalFacturaStr = totalFacturaStr.replace(/[$,]/g, '').trim();
            const totalFactura = parseFloat(totalFacturaStr);



            if (fechaStr >= sevenDaysAgoStr && fechaStr <= todayStr) {
                total += totalFactura;
                
            }
        } else {
            console.error('Formato de fecha inválido:', fechaText);
        }
    });

    document.getElementById('start-week3').textContent = sevenDaysAgo.toISOString().split('T')[0];
    document.getElementById('current-day3').textContent = today.toISOString().split('T')[0];
    document.getElementById('total-value3').textContent = '$ ' + total.toLocaleString();
}

function calcularTotalfiltradoDinamicas(fechaInicio, fechaFin) {
    // Convertir las fechas de entrada a formato YYYY-MM-DD para comparar
    const fechaInicioObj = new Date(fechaInicio);
    const fechaFinObj = new Date(fechaFin);

    // Asegurarse de que las fechas de inicio y fin sean válidas
    if (isNaN(fechaInicioObj) || isNaN(fechaFinObj)) {
        console.error('Formato de fecha inválido.');
        return;
    }

    // Inicializar el total
    let total = 0;

    // Iterar sobre las filas de la tabla
    $('#tabla-formulario tbody tr').each(function() {
        // Obtener la fecha de la columna correspondiente (4ta columna en este caso)
        const fechaText = $(this).find('td').eq(3).text().trim();
        const totalFacturaStr = $(this).find('td').eq(2).text().trim().replace(/[$,]/g, '').trim();
        const totalFactura = parseFloat(totalFacturaStr);

        // Verificar si la fecha está en formato YYYY-MM-DD
        const fechaArray = fechaText.split('-');
        if (fechaArray.length === 3) {
            const fechaObj = new Date(fechaArray[0], fechaArray[1] - 1, fechaArray[2]); // Mes es 0-indexado

            // Verificar si la fecha está dentro del rango especificado
            if (fechaObj >= fechaInicioObj && fechaObj <= fechaFinObj) {
                total += totalFactura;
            }
        } else {
            console.error('Formato de fecha inválido:', fechaText);
        }
    });

    // Mostrar el total en el contenedor flotante
    document.getElementById('start-week2').textContent = fechaInicio;
    document.getElementById('current-day2').textContent = fechaFin;
    document.getElementById('total-value2').textContent = '$ ' + total.toLocaleString();
}


function calcularTotalfiltrado(fechaInicio, fechaFin) {
    // Convertir las fechas de entrada a formato YYYY-MM-DD para comparar
    const fechaInicioObj = new Date(fechaInicio);
    const fechaFinObj = new Date(fechaFin);

    // Asegurarse de que las fechas de inicio y fin sean válidas
    if (isNaN(fechaInicioObj) || isNaN(fechaFinObj)) {
        console.error('Formato de fecha inválido.');
        return;
    }

    // Inicializar el total
    let total = 0;

    // Iterar sobre las filas de la tabla
    $('#tabla-formulario tbody tr').each(function() {
        // Obtener la fecha de la columna correspondiente (4ta columna en este caso)
        const fechaText = $(this).find('td').eq(3).text().trim();
        const totalFacturaStr = $(this).find('td').eq(2).text().trim().replace(/[$,]/g, '').trim();
        const totalFactura = parseFloat(totalFacturaStr);

        // Verificar si la fecha está en formato YYYY-MM-DD
        const fechaArray = fechaText.split('-');
        if (fechaArray.length === 3) {
            const fechaObj = new Date(fechaArray[0], fechaArray[1] - 1, fechaArray[2]); // Mes es 0-indexado

            // Verificar si la fecha está dentro del rango especificado
            if (fechaObj >= fechaInicioObj && fechaObj <= fechaFinObj) {
                total += totalFactura;
            }
        } else {
            console.error('Formato de fecha inválido:', fechaText);
        }
    });

    // Mostrar el total en el contenedor flotante
    document.getElementById('start-week').textContent = fechaInicio;
    document.getElementById('current-day').textContent = fechaFin;
    document.getElementById('total-value').textContent = '$ ' + total.toLocaleString();
}

function calcularTotalfiltradoCombinado(fechaInicio, fechaFin) {
    // Convertir las fechas de entrada a formato YYYY-MM-DD para comparar
    const fechaInicioObj = new Date(fechaInicio);
    const fechaFinObj = new Date(fechaFin);

    // Asegurarse de que las fechas de inicio y fin sean válidas
    if (isNaN(fechaInicioObj) || isNaN(fechaFinObj)) {
        console.error('Formato de fecha inválido.');
        return;
    }

    // Inicializar el total
    let total = 0;

    // Iterar sobre las filas de la tabla
    $('#tabla-formulario tbody tr').each(function() {
        // Obtener la fecha de la columna correspondiente (4ta columna en este caso)
        const fechaText = $(this).find('td').eq(3).text().trim();
        const totalFacturaStr = $(this).find('td').eq(2).text().trim().replace(/[$,]/g, '').trim();
        const totalFactura = parseFloat(totalFacturaStr);

        // Verificar si la fecha está en formato YYYY-MM-DD
        const fechaArray = fechaText.split('-');
        if (fechaArray.length === 3) {
            const fechaObj = new Date(fechaArray[0], fechaArray[1] - 1, fechaArray[2]); // Mes es 0-indexado

            // Verificar si la fecha está dentro del rango especificado
            if (fechaObj >= fechaInicioObj && fechaObj <= fechaFinObj) {
                total += totalFactura;
            }
        } else {
            console.error('Formato de fecha inválido:', fechaText);
        }
    });

    // Mostrar el total en el contenedor flotante
    document.getElementById('start-week3').textContent = fechaInicio;
    document.getElementById('current-day3').textContent = fechaFin;
    document.getElementById('total-value3').textContent = '$ ' + total.toLocaleString();
}


// carga de datos para las tablas
function cargarDatos() {
    // Enviar solicitud AJAX para obtener datos
    $.ajax({
        url: reporteVentas,  // Reemplaza con la URL correcta de tu vista
        type: 'GET',
        success: function(response) {
            var tbody = $('#tabla-formulario tbody');
            tbody.empty(); // Limpiar el tbody antes de agregar nuevas filas

            // Agregar filas a la tabla
            response.facturas.forEach(function(factura) {
                var fila = '<tr>' +
                    '<td>' + factura.nfactura + '</td>' +
                    '<td>' + factura.nombreCliente + '</td>' +
                    '<td>' + factura.total_factura_formateado + '</td>' +
                    '<td>' + factura.fecha_facturacion + '</td>' +
                    '</tr>';

                tbody.append(fila);

            });


            calcularTotalUltimaSemana();
            
        },  
        error: function(xhr, status, error) {
            console.error('Error al obtener los datos:', error);
            document.getElementById('total-value').textContent = 'Error al cargar total';
        }
    });
}
function cargarDatosVentasDinamicas() {

    var editar = '/reportes/editar-remision/';
    var anular = '/reportes/anular-remision/';
    // Enviar solicitud AJAX para obtener datos
    $.ajax({
        url: reporteVentasDinamicas,  // Reemplaza con la URL correcta de tu vista
        type: 'GET',
        success: function(response) {
            var tbody = $('#tabla-formulario2 tbody');
            tbody.empty(); // Limpiar el tbody antes de agregar nuevas filas

            // Agregar filas a la tabla
            response.remisiones.forEach(function(remision) {
                var fila = '<tr>' +
                    '<td>' + remision.nremision + '</td>' +
                    '<td>' + remision.nombreCliente + '</td>' +
                    '<td>' + remision.total_remision_formateado + '</td>' +
                    '<td>' + remision.fecha_remision + '</td>' +
                    '<td>' +
                    '<a href="#" class="view" data-id="' + remision.nremision + '" title="Ver Factura"><i class="bi bi-eye"></i></a>' +
                    (remision.remisionAnulada ?
                        '<a href="#" class="noEdit" title="No puede Editar"><i class="bi bi-clipboard2-x"></i></a>' :
                        '<a href="'+ editar + remision.nremision +'" class="edit" title="Editar Factura"><i class="bi bi-pencil"></i></a>'
                    ) +
                    (remision.remisionAnulada ?
                        '<a href="#" class="disabled" title="Factura Anulada">' +
                        '<i class="bi bi-folder-x"></i>' +
                        '</a>' :
                        '<a href="'+ anular + remision.nremision +'" class="cancel" title="Anular Factura"><i class="bi bi-x-octagon"></i></a>'
                    ) +
                    '</td>';
                '</tr>';

                    console.log('estado remision', remision.remisionAnulada)

                tbody.append(fila);
                inicializarEventos();

            });

            
            calcularTotalUltimaSemanaVD();
            
        },  
        error: function(xhr, status, error) {
            console.error('Error al obtener los datos:', error);
            document.getElementById('total-value2').textContent = 'Error al cargar total';
        }
    });
}

function openModal(remision) {
    // Aquí puedes cargar contenido dinámico basado en `facturaId`
    // Por ejemplo, hacer una solicitud AJAX para obtener detalles de la factura
    // document.getElementById('modalFacturaN').textContent = 'N° de Factura: ' + facturaId;

    // Mostrar el modal
    var modal = document.getElementById('modalDetalleOrden');
    modal.style.display = "block";


    $.ajax({
        type: "GET",
        url: remi,
        data: {
            remisionId: remision
        },
        success: function(response){
            var tbody = $('#tabla-formulario-modal tbody');
                tbody.empty(); // Limpiar el contenido previo

                let totalCantidad = 0;
                let totalPeso = 0;
                let pesofila=0;
            
                // Verificar si hay productos en la respuesta
                if (response.productos && response.productos.length > 0) {
                    response.productos.forEach(function(producto) {
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
                        $('.valorIVA').text('$' + '-' );
                        $('#modalFacturaN').text('N° de Venta: ' + remision);
                        $('.taza').text('% -');

                        
                        $('.valorSUBTOTAL').text('$' + '' + producto.subtotal);
                        
                    });
                    var totalFila = '<tr>' +
                    '<td><strong>Total de Unidades:</strong></td>' +
                    '<td><strong>' + (totalCantidad % 1 === 0 ? parseInt(totalCantidad) : totalCantidad.toFixed(2)) + '</strong></td>' +
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
            // Manejo de errores
            console.error('Error al obtener datos de remision:', error);
        }
    })

}

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
        '<td class="valorTOTAL">[Eliminado]</td>' 
    );
    modalContent = modalContent.replace(
        /<td class="ICA">[\s\S]*?<\/td>/g,  // Esto elimina el ICA  
        ''
    );
    modalContent = modalContent.replace(
        /<td class="taza">[\s\S]*?<\/td>/g,  // Esto elimina el ICA
        ''
    );
    modalContent = modalContent.replace(
        /<td class="valorSUBTOTAL">[\s\S]*?<\/td>/g,  // Esto elimina el ICA
        '<td class="valorSUBTOTAL">[Eliminado]</td>'
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
                            padding: 20px; /* Padding para separar contenido */
                            background-color: #fff; /* Fondo blanco */
                            
                        }
                        .second-modal {
                            page-break-before: always;
                            margin-top: 4cm;
                            padding: 20px;
                            background-color: #fff;
                            border: 1px solid #000;
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

    printWindow.document.write('</head><body >');
    printWindow.document.write(modalContent);
    printWindow.document.write('<hr>');  // Opcional, para separar las dos copias
    printWindow.document.write(secondModalContent); // Segunda copia modificada
    printWindow.document.write('</body></html>');

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
}



function inicializarEventos() {
    $('#tabla-formulario2').off('click', '.view');
    $('#tabla-formulario2').off('click', '.cancel');

    $('#tabla-formulario2').on('click', '.view', function(e) {
        e.preventDefault();
        var remisionId = $(this).data('id');
        console.log('factura: ', remisionId);
        // Aquí abre el modal y carga la información de la remisión
        openModal(remisionId);
    });

    $('#tabla-formulario2').on('click', '.cancel', function(e) {
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



function cargarDatosCombinados() {
    $.when(
        $.ajax({ url: reporteVentas, type: 'GET' }),
        $.ajax({ url: reporteVentasDinamicas, type: 'GET' })
    ).done(function(response1, response2) {
        var tbody = $('#tabla-formulario3 tbody');
        tbody.empty(); // Limpiar el tbody antes de agregar nuevas filas

        // Manejar la primera respuesta (facturas)
        response1[0].facturas.forEach(function(factura) {
            var fila = '<tr>' +
                '<td>' + factura.nfactura + '</td>' +
                '<td>' + factura.nombreCliente + '</td>' +
                '<td>' + factura.total_factura_formateado + '</td>' +
                '<td>' + factura.fecha_facturacion + '</td>' +
                '</tr>';
            tbody.append(fila);
        });

        // Manejar la segunda respuesta (remisiones)
        response2[0].remisiones.forEach(function(remision) {
            var fila = '<tr>' +
                '<td>' + remision.nremision + '</td>' +
                '<td>' + remision.nombreCliente + '</td>' +
                '<td>' + remision.total_remision_formateado + '</td>' +
                '<td>' + remision.fecha_remision + '</td>' +
                '</tr>';
            tbody.append(fila);
        });


        // Calcular total para la tabla combinada
        calcularTotalUltimaSemanaCombinada();
    }).fail(function(xhr, status, error) {
        console.error('Error al obtener los datos combinados:', error);
        document.getElementById('total-value3').textContent = 'Error al cargar total';
    });
}

function costeoInventario() {
    console.log('enviando solicitud ')
    console.log('URL de costeoInventario:', costeoInventarioURL);

    // Enviar solicitud AJAX para obtener datos
    $.ajax({
        url: costeoInventarioURL,  // Reemplaza con la URL correcta de tu vista
        type: 'GET',
        success: function(response) {
            console.log('se envian los datos')
            console.log('Respuesta del servidor:', response);
            var tbody = $('#tabla-formulario4 tbody');
            tbody.empty(); // Limpiar el tbody antes de agregar nuevas filas

            // Agregar filas a la tabla
            response.productos.forEach(function(producto) {
                var precio = parseFloat(producto.precio.replace(/,/g, ''));
                var totalFila = producto.cantidad * precio;
                var fila = '<tr>' +
                    '<td>' + producto.codigo + '</td>' +
                    '<td>' + producto.nombre + '</td>' +
                    '<td>' + producto.cantidad + '</td>' +
                    '<td>' + producto.precio +'</td>' +  
                    '<td>' + totalFila.toLocaleString() +'</td>' + 
                    '</tr>';

                tbody.append(fila);
            });
            
            calcularTotalInventario()
            
        },  
        error: function(xhr, status, error) {
            console.error('Error al obtener los datos:', error);
            console.log('Estado de la solicitud:', status);
            console.log('Respuesta del servidor:', xhr.responseText);
            
        }
    });
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