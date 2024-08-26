document.addEventListener("DOMContentLoaded", function() {
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
});