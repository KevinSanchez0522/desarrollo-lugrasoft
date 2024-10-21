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
    $('#filtroCodigo').on('change', function() {
        var filtro = $(this).val(); // Valor seleccionado
        var filas = $('.tabla tbody tr');

        filas.each(function() {
            var fila = $(this);
            var codigoInventario = fila.children('td').first().text(); // Obtener el ID del producto

            // Mostrar u ocultar la fila
            if (filtro) {
                if (codigoInventario === filtro) {
                    fila.show(); // Mostrar fila si coincide con el código
                } else {
                    fila.hide(); // Ocultar si no coincide
                }
            } else {
                fila.show(); // Si no hay filtro, mostrar todas las filas
            }
        });
    });
});