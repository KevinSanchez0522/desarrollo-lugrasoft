document.addEventListener("DOMContentLoaded", function() {

    $('.js-example-basic-single').select2();
    // Función para filtrar la tabla
    document.getElementById('filtro').addEventListener('change', function () {
        var filtro = this.value;
        var filas = document.querySelectorAll('.tabla tbody tr');
        
        filas.forEach(function (fila) {
            var tipo = fila.getAttribute('data-tipo');
            if (filtro === '') {
                // Si no se selecciona ninguna opción, mostrar todas las filas
                fila.style.display = '';
            } else if (filtro === 'materias') {
                // Mostrar solo las filas con tipo "m" (Materias Primas)
                if (tipo === 'm') {
                    fila.style.display = '';
                } else {
                    fila.style.display = 'none';
                }
            } else if (filtro === 'P_terminados') {
                // Mostrar solo las filas con tipo "m" (Materias Primas)
                if (tipo === 'pt') {
                    fila.style.display = '';
                } else {
                    fila.style.display = 'none';
                }
            } else {
                // Ocultar las filas que no coinciden con el filtro
                var tipo = fila.getAttribute('data-tipo');
                if (tipo === filtro) {
                    fila.style.display = '';
                } else {
                    fila.style.display = 'none';
                }
            }
        });
    });
    $('#filtroCodigo').on('keyup', function() {
        var filtro = $(this).val().toLowerCase(); // Obtener el valor del filtro (convertido a minúsculas)
        var filas = $('.tabla tbody tr'); // Seleccionar todas las filas de la tabla

        filas.each(function() {
            var fila = $(this);
            var nombreProducto = fila.children('td').eq(1).text().toLowerCase(); // Obtener el nombre del producto (de la columna que contiene el nombre)
            var codigo = fila.children('td').eq(0).text()
            // Mostrar u ocultar la fila en función de si el nombre contiene el filtro
            if (filtro) {
                if (nombreProducto.indexOf(filtro) !== -1 || codigo.indexOf(filtro) != -1) { // Si el nombre contiene el filtro
                    fila.show(); // Mostrar la fila
                } else {
                    fila.hide(); // Ocultar la fila si no contiene el filtro
                }
            } else {
                fila.show(); // Si el filtro está vacío, mostrar todas las filas
            }
        });
    });


    $('.bi-pencil-square').on('click', function() {
        var id = $(this).attr('data-id');  // Obtener el ID del producto
        var tdNombre = $(this).closest('tr').find('td.editable');  // Buscar la celda que contiene el nombre
        var iconoReiniciar = $(this).closest('tr').find('.bi-arrow-clockwise');

        iconoReiniciar.css('display', 'flex')

        // Si la celda ya está en modo de edición, no hacer nada
        if (tdNombre.find('input').length) return;

        // Convertir la celda en un input
        var currentName = tdNombre.text();  // Obtener el nombre actual
        tdNombre.html('<input  class= "edicion-input" type="text" value="' + currentName + '" />');

        // Establecer el enfoque en el campo de texto para que el usuario pueda escribir
        tdNombre.find('input').focus();

        // Escuchar cuando el usuario termine de editar (con 'blur' o 'enter')
        tdNombre.find('input').on('blur', function() {
            var newName = $(this).val();  // Obtener el nuevo valor

            // Si el nombre ha cambiado, mostrar el ícono de reiniciar
            if (newName !== currentName) {
                iconoReiniciar.css('display', 'flex');
            } else {
                iconoReiniciar.css('display', 'none');
            }

            });

            // O también puedes manejar cuando el usuario presiona "Enter" para finalizar la edición
            tdNombre.find('input').on('keypress', function(event) {
                if (event.key === 'Enter') {
                    $(this).blur();  // Simula el 'blur' para guardar el valor
                }
            });
        



        $('.bi-arrow-clockwise').on('click', function() {
            var tr = $(this).closest('tr');  // Obtener la fila
            var tdNombre = tr.find('td.editable');  // Encontrar la celda de nombre
            var id = tr.find('.bi-pencil-square').attr('data-id');  // Obtener el ID del producto
            var nuevoNombre = tdNombre.find('input').val();  // Obtener el nuevo nombre
            var iconoReiniciar = $(this)
    
            // Confirmar antes de enviar
            var confirmacion = confirm('¿Estás seguro de que quieres guardar los cambios?');
    
            if (confirmacion) {
                // Realizar la solicitud AJAX para guardar el cambio en el backend
                $.ajax({
                    url: EditarNombreInventario,  // URL donde se envía la solicitud
                    method: 'POST',
                    data: {
                        'id': id,
                        'new_name': nuevoNombre,
                    },
                    headers: {'X-CSRFToken': getCookie('csrftoken')},
                    success: function(response) {
                        // Si la actualización es exitosa, actualiza el nombre en la tabla
                        tdNombre.html(nuevoNombre);
                        // Ocultar el ícono de reiniciar
                        iconoReiniciar.css('display', 'none');
                        alert(response.message)
                    },
                    error: function(error) {
                        // Si ocurre un error, mostrar un mensaje de error
                        alert('Error al actualizar el nombre');
                    }
                });
            } else {
                // Si no se confirma, puedes restaurar la celda a su estado original (opcional)
                var currentName = tdNombre.text();
                tdNombre.html(currentName);  // Restaurar el valor original
                iconoReiniciar.css('display', 'none');  // Ocultar el ícono de flecha
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
            // Verificar si la cookie comienza con el nombre deseado
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
    }