


    $(document).ready(function() {
        $('#uploadButton').on('click', function() {
            var fileInput = $('#fileInput')[0].files[0];
            var formData = new FormData();
            formData.append('file', fileInput);

            $.ajax({
                url: cargardatos, // URL para la vista que maneja la carga de archivos
                type: 'POST',
                data: formData,
                contentType: false,
                processData: false,
                headers: {
                    'X-CSRFToken': getCookie('csrftoken')  // Asegúrate de que getCookie esté implementado
                },
                success: function(response) {
                    if (response.error) {
                        console.error('Error:', response.error);
                        return;
                    }
        
                    // Procesar los datos y actualizar la tabla
                    const data = response.data;
                    const tbody = document.querySelector('#tabla-saldos tbody');
                    tbody.innerHTML = ''; // Limpiar la tabla antes de agregar nuevos datos
                    const today = new Date().toISOString().split('T')[0];
                    data.forEach(row => {
                        const tr = document.createElement('tr');
                        
                        // Agrega celdas a la fila
                        Object.values(row).forEach((value, index) => {
                            const td = document.createElement('td');
                            td.textContent = value;

                            tr.appendChild(td);
                        });
        
                        tbody.appendChild(tr);
                    });
                },
                error: function(xhr, status, error) {
                    $('#result').text('Error: ' + error);
                }
            });
        });



        $('.boton').on('click', function(){
            const datosTabla = obtenerDatosDeTabla();
        
            $.ajax({
                url: procesarDatos, // URL a la que enviarás los datos
                type: 'POST',
                data: JSON.stringify({ datos: datosTabla }),
                contentType: 'application/json',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken')  // Asegúrate de que getCookie esté implementado
                },
                success: function(response) {
                    console.log('Datos enviados con éxito:', response);
                    alert('datos cargados correctamente')
                    location.reload();
                },
                error: function(xhr, status, error) {
                    console.error('Error al enviar datos:', error);
                    alert('error con la carga de los datos')
                }
            });
    
            
        })
    });




    function obtenerDatosDeTabla() {
        const rows = document.querySelectorAll('#tabla-saldos tbody tr');
        const datos = [];
    
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            const filaDatos = {};
    
            // Reemplaza estos nombres de columna con los reales si son diferentes
            const nombresColumnas = ['Codigo', 'Nombre', 'Cantidad', 'Costo Unitario', 'Total', 'Fecha de ingreso', 'Unidad de medida', 'Proveedor', 'Tipo', 'Identificador'];
    
            cells.forEach((cell, index) => {
                filaDatos[nombresColumnas[index]] = cell.textContent;
            });
    
            datos.push(filaDatos);
        });
    
        console.log('Datos de la tabla:', datos);
        return datos;
    }
    