document.addEventListener('DOMContentLoaded', function () {
    // Asegúrate de que los enlaces tengan el evento adecuado
    document.querySelectorAll('.eliminar-item').forEach(function (enlace) {
        enlace.addEventListener('click', function (event) {
            confirmarEliminar(enlace, event);
        });
    });

    function confirmarEliminar(element, event) {
        event.preventDefault();  // Evita la acción predeterminada del enlace
        
        // Obtener el código del producto
        const codInventario = element.getAttribute('data-id');
        
        // Confirmación con el usuario
        if (confirm('¿Estás seguro de eliminar este producto?')) {
            // Configurar la URL y parámetros
            const url = EliminarItemTabla.replace('0', codInventario);
            
            // Enviar la solicitud AJAX con jQuery
            $.ajax({
                url: url,  // URL con el cod_inventario
                type: 'DELETE',  // Método DELETE
                headers: {
                    'X-CSRFToken': getCookie('csrftoken'),  // Si usas Django y tienes el CSRF token
                },
                success: function (data) {
                    if (data.success) {
                        // Eliminar fila de la tabla si fue exitoso
                        element.closest('tr').remove();
                        alert('Producto eliminado correctamente');
                    } else {
                        alert('Error al eliminar el producto');
                    }
                },
                error: function (xhr, status, error) {
                    console.error('Error:', error);
                    alert('Hubo un error al eliminar el producto');
                }
            });
        }
    }
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