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
    const tablaBody = document.querySelector('#kardex_table tbody');
    tablaBody.innerHTML = '';  // Limpiar tabla antes de agregar nuevos datos

    kardex.forEach(item => {
        // Crear una nueva fila
        const fila = document.createElement('tr');
        // Definir el contenido HTML de la fila
        fila.innerHTML = `
            <td>${item.fecha}</td>
            <td>${item.descripcion}</td>
            <td>${item.referencia}</td>
            <td>${item.entradas}</td>
            <td>${item.salidas}</td>
            <td>${item.saldo}</td>
        `;
        // Agregar la fila al tbody
        tablaBody.appendChild(fila);
    });
}
