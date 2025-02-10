document.addEventListener('DOMContentLoaded', function() {
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


        $('#Guardar-Productos').on('click', function(){
            // Obtener todos los productos seleccionados
            const filas= $('#Tabla-Productos tbody tr');
            token= getCookie('csrftoken')
            console.log(token)
            const productos = [];
            filas.each(function(){
                const fila = $(this);
                const id = fila.find('td:eq(0)').text().trim();
                const stockMin = fila.find('td:eq(3) input ').val() || 0 ;
                const producto = {
                    id: id,
                    stock: stockMin
                }

                productos.push(producto)

                console.log(productos)

            });

            $.ajax({
                type: 'POST',
                url: ProductosXalerta,
                data: JSON.stringify({productos:productos}),
                contentType: 'application/json',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken')
                },
                success: function(response){
                    console.log(response);
                    location.reload();
                    },
                    error: function(xhr, status, error){
                        console.error('Error al guardar:', error);
                        }
                    
            });

        

        });





    })

});

function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}


