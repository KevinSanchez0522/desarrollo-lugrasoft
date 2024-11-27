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

            // Mostrar u ocultar la fila en función de si el nombre contiene el filtro
            if (filtro) {
                if (nombreProducto.indexOf(filtro) !== -1) { // Si el nombre contiene el filtro
                    fila.show(); // Mostrar la fila
                } else {
                    fila.hide(); // Ocultar la fila si no contiene el filtro
                }
            } else {
                fila.show(); // Si el filtro está vacío, mostrar todas las filas
            }
        });
    });
});