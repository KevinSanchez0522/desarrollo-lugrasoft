document.addEventListener("DOMContentLoaded", function() {

    $('#btnCargarArchivo').on('click', function(){
        var fileInput = $('#fileInventario')[0].files[0];
        var formData = new FormData();
        formData.append('file', fileInput);



        $.ajax({
            url: CargarInventario,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            },
            success: function(response) {
                console.log(response);
                if (response.error){
                    console.error('Error', response.error)
                    return;
                }
                // Si no hay error, procesar los datos y agregar a la tabla
                var data = response.data;  // Los datos que envía el backend

                // Limpiar la tabla antes de agregar los nuevos datos
                var tableBody = $('#Tabla-Productos tbody');
                tableBody.empty();  // Eliminar las filas existentes

                // Recorrer los datos y agregar las filas a la tabla
                data.forEach(function(item) {
                    var newRow = '<tr>';
                    newRow += '<td>' + item.id + '</td>';
                    newRow += '<td>' + item.ID + '</td>';  // Asume que 'ID' es el nombre de la columna
                    newRow += '<td>' + item.Nombre + '</td>';  // Asume que 'Nombre' es el nombre de la columna
                    newRow += '<td>' + item.bodega + '</td>';  // Asume que 'bodega' es el nombre de la columna
                    newRow += '<td>' + item.fisico + '</td>';  // Asume que 'fisico' es el nombre de la columna
                    newRow += '<td>' + item.total + '</td>';  // Asume que 'total' es el nombre de la columna
                    newRow += '</tr>';

                    // Agregar la nueva fila al cuerpo de la tabla
                    tableBody.append(newRow);
                });
            },
            error:function(xhr,status,error){
                $('#result').text('Error: ' + error);
            }

        })
    })


    $('#GenerarAjuste').on('click', function(){
        var productos = [];
        var filasTabla = $('#Tabla-Productos tbody tr');
        filasTabla.each(function(){
            var row = $(this);
            var cod_inventario = row.find('td').eq(1).text();
            var nombre = row.find('td').eq(2).text();
            var total = row.find('td').eq(5).text();

            productos.push({
                'cod_inventario': cod_inventario,
                'nombre': nombre,
                'total': total
            });
        });
        $.ajax({
            type: 'POST',
            url: generarAjuste,
            data: JSON.stringify(productos),
            headers:{
                'X-CSRFToken': getCookie('csrftoken')
            },
            success: function(response){
                if(response.status == 'success'){
                    alert('el ajuste se ha almacenado correctamente')
                    location.reload()
                }
            },
            error:function(xhr,status,error){
                console.error('error al enviar los datos', error)
            }
        });
    })

    
})

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