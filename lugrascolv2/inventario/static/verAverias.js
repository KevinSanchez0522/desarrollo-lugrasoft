document.addEventListener('DOMContentLoaded', function() {
    $(document).ready(function() {
        $('.js-example-basic-multiple').select2();
    });

    $('.BuscarAverias').on('click',function(){
        var fechaInicio = $('#fecha_inicio').val();
        var fechaFin = $('#fecha_fin').val();

        if (!fechaInicio || !fechaFin) {
            alert('Por favor, ingrese ambas fechas.');
            return;
        }
        $.ajax({
            url: BuscarAveriasXfecha,
            method: 'GET',
            data: {
                fecha_inicio: fechaInicio,
                fecha_fin: fechaFin
            },
            success: function(response) {
                console.log('Facturas filtradas:', response.averias);
                todasAverias = response.averias;
                actualizarTabla(todasAverias);
                calcularTotalfiltrado(fechaInicio,fechaFin)
                
            },
            error: function(xhr, status, error){
                console.log('error en la solicitud AJAX: ', status, error);
            }
        });
    })

    $('#filtroAverias').on('change', function() {
        var fechaInicio = $('#fecha_inicio').val();
        var fechaFin = $('#fecha_fin').val();
        var selectedIds = $(this).val(); // Obtener los IDs seleccionados
        
        // Si no hay elementos seleccionados, mostrar todas las averías
        if (selectedIds.length === 0) {
            // Mostrar todas las averías (sin filtrar por motivo)
            actualizarTabla(todasAverias);  // Actualiza la tabla con todas las averías
        } else {
            // Filtrar las averías según los motivos seleccionados
            var averiasFiltradas = todasAverias.filter(function(averia) {
                return selectedIds.includes(averia.motivo.toString()); // Filtrar averías por motivo
            });
            actualizarTabla(averiasFiltradas); // Actualizar la tabla con las averías filtradas
        }
        
        // Calcular total con las fechas (de todos o de las filtradas)
        calcularTotalfiltrado(fechaInicio, fechaFin);
    });

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
            const cantidad= $(this).find('td').eq(2).text().trim();
            const costo = $(this).find('td').eq(3).text().trim().replace(/[$,]/g, '').trim();
            const totalfila = cantidad*costo;
            total += parseFloat(totalfila);
    
            // Verificar si la fecha está en formato YYYY-MM-
        });
    
        // Mostrar el total en el contenedor flotante

        document.getElementById('total-value').textContent = '$ ' + total.toLocaleString();
    }
    

    function actualizarTabla(averias) {
        var tbody = $('#tabla-formulario tbody');
        tbody.empty(); // Limpiar el tbody antes de agregar nuevas filas
    

    
        // Agregar filas a la tabla
        $.each(averias, function(index, averia) {
            var fila = '<tr>' +
                '<td>' + averia.id_averia + '</td>' +
                '<td>' + averia.nombreProducto + '</td>' +
                '<td>' + averia.cantidad + '</td>' +
                '<td>$ ' + averia.costo + '</td>' +
                '<td>' + averia.fecha_averia + '</td>' +
                '<td>' + averia.motivo + '</td>' +
                '</tr>';
            tbody.append(fila);
        });
    }

    $('.imprimir').on('click', function() {
        imprimirContenido();
    });

    function imprimirContenido() {
        // Selecciona el contenido del área de trabajo
        var contenido = $('.impresion').clone(); // Clonamos el contenido para no afectar el original
        var estilos = imprimir
        contenido.find('.BuscarAverias').hide();
        contenido.find('.imprimir').hide();
        contenido.find('label').hide();
        contenido.find('#filtroAverias').hide();
        var select = contenido.find('#filtroAverias');
       
        select.find('option:selected').hide(); // Ocultar las opciones seleccionadas
    
        // Ocultar el contenedor de Select2
        contenido.find('.select2-container').hide(); // Ocultar el contenedor de Select2
    
        // Desactivar el select2 para que no se muestre el estilo
        select.prop('disabled', true); // Desactivar el select2
        contenido.find('#descripcion').hide();
        contenido.find('#fecha_inicio').hide();
        contenido.find('#fecha_fin').hide();
        contenido.find('#contenedor-fecha').hide();
        var observacion = $('#descripcion').val();
        var fechaInicio = $('#fecha_inicio').val(); // Capturar la fecha de inicio
        var fechaFin = $('#fecha_fin').val(); // Capturar la fecha de fin

        
        // Crear una nueva ventana
        var ventanaImpresion = window.open('', '', 'width=1000 ,height=800');
        
        // Agregar estilos si es necesario
        ventanaImpresion.document.write('<html><head><title>Reporte de averia</title>');
        ventanaImpresion.document.write('<link rel="stylesheet" href="'+ estilos +'"'); 

        ventanaImpresion.document.write('</head><body>');
        ventanaImpresion.document.write('<h1 class="tituloImpresion"> Reporte de averia </h1>')
        ventanaImpresion.document.write('<p>Fecha Inicial: ' + fechaInicio + '</p>');
        ventanaImpresion.document.write('<p>Fecha Final: ' + fechaFin + '</p>');
        ventanaImpresion.document.write('<textarea>Observación: ' + observacion + '</textarea>');

        ventanaImpresion.document.write(contenido.html()); // Escribir el contenido en la nueva ventana
        ventanaImpresion.document.write('</body></html>');
        
        ventanaImpresion.document.close(); // Cerrar el documento
        ventanaImpresion.focus(); // Enfocar la ventana
        ventanaImpresion.print(); // Iniciar la impresión
         // Cerrar la ventana después de imprimir
    }

});