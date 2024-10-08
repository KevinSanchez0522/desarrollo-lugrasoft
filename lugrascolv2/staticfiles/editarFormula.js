$(document).ready(function() {

    
    $('#materias').select2();
        
        
    // Eliminar una fila de la tabla al hacer clic en el icono de basura
    $('#tabla-formulario').on('click', '.delete-materia', function(e) {
        e.preventDefault();  // Prevenir la acción predeterminada del enlace
        
        // Confirmar con el usuario antes de eliminar
        if (confirm('¿Estás seguro de que deseas eliminar esta materia prima?')) {
            // Eliminar la fila correspondiente de la tabla
            $(this).closest('tr').remove();  // Eliminar la fila completa
        }
    });



    var selector = $('#materias');
    
    // Cuando se seleccione un producto en el select2
    selector.on('select2:select', function(e) {
        var productoSeleccionado = e.params.data.id;
        
        // Realizar la solicitud fetch
        $.ajax({
            url: ver,  // Define la URL donde quieres hacer la solicitud
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ cod_inventario: productoSeleccionado }),
            headers: {
                "X-CSRFToken": getCookie("csrftoken")  // Asegúrate de tener el método getCookie definido para obtener el CSRF token
            },
            success: function(data) {
                // Si la respuesta es exitosa, agregar una nueva fila
                var nuevaFila = $('<tr>');
                nuevaFila.html(`
                    <td>${data.cod_producto}</td>
                    <td>${data.nombre}</td>
                    <td contenteditable="true">${data.cantidad}</td>
                    <td>${data.precio_unitario}</td>
                    <td><a href="#" class="delete-materia" data-id="{{ materia.materia.cod_inventario }}">
                    <i class="bi bi-trash"></i></td>
                `);

                // Añadir la fila al cuerpo de la tabla
                $('#tabla-formulario tbody').append(nuevaFila);
                
                // Agregar el evento de eliminar fila
                nuevaFila.find('.eliminar').on('click', function() {
                    $(this).closest('tr').remove();
                });
            },
            error: function(xhr, status, error) {
                console.error('Error:', error);
            }
        });
    });

    $('#guardarFormula').on('click', function(e) {
        e.preventDefault();  // Prevenir acción por defecto

        // Recoger los datos del formulario
        var formulaData = {
            codig: $('#Codig').val(),
            nombre: $('#Nombre').val(),
            utilidad: $('#Utilidad').val(),
            iva: $('#V_Iva').val(),
            costos_indirectos: $('#C_indirecto').val(),
            materias_primas: []
        };

        // Recoger los datos de las filas de la tabla
        $('#tabla-formulario tbody tr').each(function() {
            var materia = $(this);
    // Obtener el código de inventario de la primera columna (td)
            var cod_inventario = materia.find('td').eq(0).text();

            // Obtener la cantidad:
            // Si la celda tiene un <input>, usamos .val()
            // Si la celda es contenteditable, usamos .text()
            var cantidad;
            var cantidadCell = materia.find('td').eq(2); // Suponiendo que la cantidad está en la tercera columna
            if (cantidadCell.find('input').length > 0) {
                // Si hay un <input> dentro de la celda, obtenemos su valor
                cantidad = cantidadCell.find('input').val();
            } else if (cantidadCell.is('[contenteditable]')) {
                // Si la celda es contenteditable, obtenemos el texto
                cantidad = cantidadCell.text();
            }

            // Obtener el precio unitario de la cuarta columna (td)
            

            // Crear un objeto con los datos de la materia
            var materiaData = {
                cod_inventario: cod_inventario,
                cantidad: cantidad,
            };
            formulaData.materias_primas.push(materiaData);
            
        });
        console.log('Objeto que se enviará:', formulaData); 

        // Enviar la solicitud AJAX
        $.ajax({
            url: actualizar,  // URL del backend que maneja la actualización
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(formulaData),
            headers: {
                "X-CSRFToken": getCookie("csrftoken")  // Asegúrate de que el token CSRF esté presente
            },
            success: function(response) {
                alert('Fórmula actualizada exitosamente');
            },
            error: function(xhr, status, error) {
                console.error('Error al actualizar la fórmula', error);
                alert('Hubo un problema al actualizar la fórmula');
            }
        });
    });

});

function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}