document.addEventListener('DOMContentLoaded', function() {


    // Calcular la fecha de un mes atrás
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(today.getMonth() - 1);
    
    // Convertir las fechas a formato YYYY-MM-DD
    const formatDate = (date) => date.toISOString().split('T')[0];
    const startDate = formatDate(lastMonth);
    const endDate = formatDate(today);
    
    $('.link').on('click', function(){
    url = dashboardURL
    
    window.location.href = url;
    })

    $.ajax({
    type: "POST",
    url: ordenes,
    headers: {
        "X-CSRFToken": getCookie("csrftoken")
    },
    success: function(response) {
        // Manejar la respuesta exitosa
        console.log('Datos de órdenes:', response);

        // Actualizar el DOM con los datos recibidos
        $('.creados').text(response.creado);
        $('.proceso').text(response.en_proceso);
        $('.xFacturar').text(response.por_facturar);
    },
    error: function(xhr, status, error) {
        // Manejar errores de la solicitud AJAX aquí
        console.error('Error en la solicitud AJAX:', error);
    }
    })


    $.ajax({
    type: "POST",
    url: promedioVentas, // Asegúrate de que esta URL sea correcta para tu vista Django
    headers: {
        "X-CSRFToken": getCookie("csrftoken")
    },
    data: JSON.stringify({
        start_date: startDate,
        end_date: endDate
    }),
    contentType: "application/json",
    success: function(response) {
        // Manejar la respuesta exitosa
        console.log('Promedio de ventas:', response.promedio_ventas);

        // Actualizar el DOM con el promedio
        $('#promedio-ventas').text(response.promedio_ventas);

        // Crear un gráfico utilizando Chart.js
        const ctx = document.getElementById('ventasMensualesChart').getContext('2d');
        const ventasChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Promedio de Ventas'],
                datasets: [{
                    label: 'Promedio de Ventas',
                    data: [response.promedio_ventas],
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    },
    error: function(xhr, status, error) {
        // Manejar errores de la solicitud AJAX aquí
        console.error('Error en la solicitud AJAX:', error);
    }
    });


    $.ajax({
    type: "POST",
    url: ventasDiarias, // Asegúrate de que esta URL sea correcta para tu vista Django
    headers: {
        "X-CSRFToken": getCookie("csrftoken")
    },
    data: JSON.stringify({
        start_date: startDate,
        end_date: endDate
    }),
    contentType: "application/json",
    success: function(response) {
        // Manejar la respuesta exitosa
        console.log('ventas por dia:', response);

        // Actualizar el DOM con el promedio
        //$('#promedio-ventas').text(response.ventas_diarias);

        // Crear un gráfico utilizando Chart.js
        const ctx = document.getElementById('ventasDiariasChart').getContext('2d');
        const ventasdiariasChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: response.fechas,
                datasets: [{
                    label: 'numero de ventas por dia ',
                    data: response.conteo_ventas,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'day'
                        }
                    },
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    },
    error: function(xhr, status, error) {
        // Manejar errores de la solicitud AJAX aquí
        console.error('Error en la solicitud AJAX:', error);
    }
    });




    // Llamar la función inmediatamente para hacer la primera solicitud
    ObtenerProductosAlerta();

    // Configurar setInterval para disparar la petición cada 2 horas (7200000 milisegundos)
    setInterval(ObtenerProductosAlerta, 7200000);  // 2 horas = 7200000 milisegundos


});
    
    
                function getCookie(name) {
                let cookieValue = null;
                if (document.cookie && document.cookie !== '') {
                const cookies = document.cookie.split(';');
                for (let i = 0; i < cookies.length; i++) {
                    const cookie = cookies[i].trim();
                    if (cookie.substring(0, name.length + 1) === (name + '=')) {
                        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                        break;
                    }
                }
                }
                return cookieValue;
                }



                    // Función que realiza la petición AJAX
    function ObtenerProductosAlerta() {
        $.ajax({
            url: ListaProductos,  // La URL a la que se enviará la petición
            method: 'POST',             // El tipo de solicitud (puede ser GET o POST)
            headers:{
                "X-CSRFToken": getCookie('csrftoken')
            },
            success: function(response) {
                // Código que se ejecuta si la petición es exitosa
                console.log('Respuesta del servidor:', response);
                if (response.status === 'success') {

                    $('.alert-icon').css('display', 'flex')
                    // Limpiar la tabla antes de agregar nuevos datos
                    $('#tabla-PPA tbody').empty();
    
                    // Recorrer los productos y agregar filas a la tabla
                    response.productos.forEach(function(producto) {
                        var fila = `
                            <tr>
                                <td>${producto.id}</td>
                                <td>${producto.nombre}</td>
                                <td>${producto.cantidad}</td>
                                <td>${producto.cantidad_min}</td>
                            </tr>
                        `;
                        $('#tabla-PPA tbody').append(fila);  // Agregar la fila a la tabla
                    });
                } else {
                    // Si ocurre un error, mostrarlo en la consola
                    console.error('Error:', response.message);
                }
            },
            error: function(xhr, status, error) {
                // Código que se ejecuta si ocurre un error
                console.log('Error en la petición AJAX:', error);
            }
        });
    }