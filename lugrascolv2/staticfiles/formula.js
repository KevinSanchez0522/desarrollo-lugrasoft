$(document).ready(function() {
$('#materias').select2();

});
// Definir tablaFormulario globalmente
var tablaFormulario;

document.addEventListener('DOMContentLoaded', function() {
    var formulario = document.getElementById('formulario');

    formulario.addEventListener('submit', function(event) {
        event.preventDefault(); // Evitar que el formulario se envíe de forma predeterminada
        if (!validarDatos()) {
            alert('Por favor, complete todos los campos correctamente antes de enviar el formulario.');
            return;
        }

        // Obtener los datos del formulario
        var formData = new FormData(formulario);



        // Obtener los datos de la tabla
        var tablaData = [];
        var filas = tablaFormulario.getElementsByTagName('tbody')[0].rows;
        for (var i = 0; i < filas.length; i++) {
            var rowData = {};
            rowData.cod_producto = filas[i].cells[0].innerText.trim();
            rowData.nombre = filas[i].cells[1].innerText.trim();
            rowData.cantidad = filas[i].cells[2].innerText.trim();
            rowData.precio_unitario = filas[i].cells[3].innerText.trim();

            // Validar si la fila contiene datos no vacíos
            if (rowData.cod_producto !== '' && rowData.nombre !== '' && rowData.cantidad !== '' && rowData.precio_unitario !== '') {
                tablaData.push(rowData);
            }
        }

        // Agregar los datos de la tabla al formData
        formData.append('tablaData', JSON.stringify(tablaData));

        if (confirm('¿Estás seguro de enviar los datos?')) {

            for (var pair of formData.entries()) {
                console.log(pair[0] + ': ' + pair[1]);
            }
            // Enviar los datos al servidor
            fetch(guardar, {
                method: 'POST',
                body: formData
            })
            .then(response => response.ok ? response.json() : Promise.reject('Error al procesar la solicitud.'))
            .then(data => {
                // Hacer algo con la respuesta del servidor si es necesario
                console.log('Datos guardados:', data);
                // Limpiar el formulario y la tabla después de enviar los datos
                formulario.reset(); // Limpiar el formulario
                limpiarTabla(); // Limpiar la tabla
            })
            .catch(error => console.error('Error:', error));
        
        }
    });





    // Asegúrate de que el elemento exista antes de asignarle
    tablaFormulario = document.getElementById('tabla-formulario');
    if (!tablaFormulario) {
        console.error('El elemento tabla-formulario no existe en el DOM.');
        return;
    }

    var tbody = tablaFormulario.getElementsByTagName('tbody')[0];
    if (!tbody) {
        console.error('No se encontró tbody dentro de tabla-formulario.');
        return;
    }

var selector = $('#materias');
selector.on('select2:select', function(e) {
var productoSeleccionado = e.params.data.id;

            fetch(ver, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    "X-CSRFToken": getCookie("csrftoken")
                },
                body: JSON.stringify({ cod_inventario: productoSeleccionado })
            })

            
            .then(response => response.ok ? response.json() : Promise.reject('Error al procesar la solicitud.'))
            .then(data => {
                var nuevaFila = tbody.insertRow(-1);
                nuevaFila.innerHTML = `<td>${data.cod_producto}</td>` +
                                    `<td>${data.nombre}</td>` +
                                    `<td contenteditable="true">${data.cantidad}</td>` +
                                    `<td>${data.precio_unitario}</td>` +
                                    `<td><button class="eliminar" onclick="eliminarFila(this)">Eliminar</button></td>`;
            
            })
            .catch(error => console.error('Error:', error));
    });
        // Función para validar los datos del formulario antes de enviar
        function validarDatos() {
        // Aquí puedes agregar las validaciones necesarias
        // Por ejemplo, verificar que los campos requeridos estén completos
        var codig = document.getElementById('Codig').value.trim();
        var nombre = document.getElementById('Nombre').value.trim();
        // Realizar las validaciones que necesites
        if (codig === '' || nombre === '') {
            return false; // Devuelve falso si los datos no son válidos
        }
        return true; // Devuelve verdadero si los datos son válidos
    }
});
// Función para limpiar la tabla
function limpiarTabla() {
    var tbody = tablaFormulario.getElementsByTagName('tbody')[0];
    tbody.innerHTML = ''; // Eliminar todas las filas de la tabla
}


function limpiarNumero(numero) {
    let limpio = numero.replace(/[^0-9.-]+/g, ''); // Elimina cualquier cosa que no sea número, punto o signo negativo
    return parseFloat(limpio) || 0; // Convierte a float, o a 0 si no es posible la conversión
}





function eliminarFila(button) {
    var fila = button.parentNode.parentNode;
    fila.parentNode.removeChild(fila);
    
}

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

