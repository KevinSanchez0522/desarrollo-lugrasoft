// script.js
document.addEventListener('DOMContentLoaded', function() {

    
        // Función para obtener la fecha de inicio de la semana
        function getStartOfWeek(date) {
            const dayOfWeek = date.getDay();
            const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Ajusta para que la semana comience el lunes
            return new Date(date.setDate(diff));
        }
    
        // Función para formatear la fecha
        function formatDate(date) {
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${year}-${month}-${day}`;
        }

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
    function calcularTotalUltimaSemana() {
        // Obtener la fecha de hoy
        const today = new Date();
        
        // Calcular la fecha de 7 días atrás
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 7);
        
        // Convertir fechas a formato YYYY-MM-DD para comparar con las fechas de la tabla
        const todayStr = today.toISOString().split('T')[0];
        const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
        
        // Inicializar el total
        let total = 0;
        console.log('Hoy:', todayStr);
        console.log('Hace 7 días:', sevenDaysAgoStr);
        
        // Iterar sobre las filas de la tabla
        $('#tabla-formulario tbody tr').each(function() {
            // Obtener la fecha de la columna correspondiente (4ta columna en este caso)
            const fechaText = $(this).find('td').eq(3).text().trim();
            
            // Verificar si la fecha está en formato YYYY-MM-DD
            if (fechaText.match(/^\d{4}-\d{2}-\d{2}$/)) {
                const fechaStr = fechaText; // Asumir que la fecha ya está en formato YYYY-MM-DD
    
                // Obtener el total de la factura y convertir a número
                let totalFacturaStr = $(this).find('td').eq(2).text().trim();
                totalFacturaStr = totalFacturaStr.replace(/[$,]/g, '').trim();
                const totalFactura = parseFloat(totalFacturaStr);

                console.log('Fecha en la tabla:', fechaStr);
                console.log('Total de factura:', totalFacturaStr);
                
    
                // Verificar si la fecha está dentro del rango de 7 días atrás hasta hoy
                if (fechaStr >= sevenDaysAgoStr && fechaStr <= todayStr) {
                    console.log('Dentro del rango. Acumulando:', totalFactura);
                    total += totalFactura;
                    console.log('total mostrar', total)
                }
            } else {
                console.error('Formato de fecha inválido:', fechaText);
            }
        });
        
        // Mostrar el total en el contenedor flotante
        document.getElementById('start-week').textContent = sevenDaysAgo.toISOString().split('T')[0];
        document.getElementById('total-value').textContent = '$ ' + total.toLocaleString();
    }

    cargarDatos();
    



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
});