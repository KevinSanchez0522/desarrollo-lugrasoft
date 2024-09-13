document.addEventListener('DOMContentLoaded', function() {

    $(document).ready(function() {
        $('#cod_producto').select2();
        
        });



    $('.BuscarFecha').click(function()  {
        console.log('click boton buscar')
        const codProducto = $('#cod_producto').val();
        const fechaInicio = $('#fecha_inicio').val();
        const fechaFinal = $('#fecha_fin').val();

        console.log('datos a enviar', codProducto, fechaInicio, fechaFinal)

        $.ajax({
            url: verKardex,
            method: 'POST',
            headers: {
                    "X-CSRFToken": getCookie("csrftoken")  // Asegúrate de obtener el token CSRF
            },
            data: {
                'cod_producto': codProducto,
                'fecha_inicio': fechaInicio,
                'fecha_final': fechaFinal
            },
            success:function(response){
                console.log('Respuesta del backend:', response);
                if (response.kardex) {
                    actualizarTabla(response.kardex);
                } else {
                    console.error(response.error);
                }

            },
            error: function(xhr, status, error) {
                console.error('Error en la solicitud:', error);
            }
            
        })
        
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


    function actualizarTabla(kardex) {
        // Selecciona el tbody dentro de la tabla con id "kardex_table"
        $('#kardex_table tbody').empty();  // Limpia el tbody
    
        // Itera sobre el array de objetos kardex
        kardex.forEach(item => {
            // Crea una nueva fila para cada objeto en kardex
            var fila = '<tr>' +
                '<td>' + item.fecha + '</td>' +
                '<td>' + item.descripcion + '</td>' +
                '<td>' + item.referencia + '</td>' +
                '<td>' + (item.entradas || 0) + '</td>' +
                '<td>' + (item.salidas || 0) + '</td>' +
                '<td>' + (item.saldo || 0) + '</td>' +
                '</tr>';
    
            // Añade la fila al tbody
            $('#kardex_table tbody').append(fila);
        });
    }
