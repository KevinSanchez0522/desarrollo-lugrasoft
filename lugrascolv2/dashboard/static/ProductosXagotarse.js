$(document).ready(function(){

    $('#select-products').select2();

    $('#select-products').on('change', function() {
        // Obtener todos los productos seleccionados
        const selectedProducts = $(this).find(':selected');
        const tbody = $('#Tabla-Productos tbody');

        // Limpiar la tabla antes de agregar nuevos elementos
        tbody.empty();

        // Iterar sobre cada producto seleccionado
        selectedProducts.each(function() {
            const $option = $(this);
            
            // Obtener datos del producto desde los atributos data
            const id = $option.data('id');
            const nombre = $option.data('nombre');
            const stock = $option.data('stock');

            // Crear fila para la tabla
            const row = `
                <tr>
                    <td>${id}</td>
                    <td>${nombre}</td>
                    <td>${stock}</td>
                    <td><input type="number" class="form-control stock-min" value="0" min="0"></td>
                </tr>
            `;

            // Agregar fila a la tabla
            tbody.append(row);
        });
    })

})