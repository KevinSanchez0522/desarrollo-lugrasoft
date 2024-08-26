document.addEventListener('DOMContentLoaded', function() {
    $(document).ready(function() {
        $('#cliente').select2();
        $('#Bproducto').select2();
        $('#orden').select2();
    });




    




});

function obtenerFechaActual() {
    // Obtener la fecha y hora actuales en UTC
    var fechaActual = new Date();
    
    // Obtener el desplazamiento horario en minutos desde UTC para la zona horaria de Colombia (UTC-5)
    var offsetColombia = -5 * 60;
    
    // Calcular la fecha y hora en la zona horaria de Colombia
    var fechaColombia = new Date(fechaActual.getTime() + offsetColombia * 60 * 1000);
    
    return fechaColombia;
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