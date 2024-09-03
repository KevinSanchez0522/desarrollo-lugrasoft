document.addEventListener('DOMContentLoaded', function() {
    var PrecioTotal = 0;

    
    $(document).ready(function() {
        $('#cliente').select2();
        $('#Bproducto').select2();
        $('#orden').select2();
    });

    function formatearNumero(numero) {
        return numero.toLocaleString('es-ES', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    // Función para desformatear el número (convertir el formato a número flotante)


    $('.entrada-precio').on('input', function(){
        
        actualizarTotalAcumulado();
        
    })
    $('.entrada-precio').on('blur', function() {
        var inputElement = $(this);
        var valor = inputElement.val();
        var valorDesformateado = desformatearNumero(valor); // Convierte el valor a número para formatearlo
        var valorFormateado = formatearNumero(valorDesformateado);

        inputElement.val(valorFormateado);
        console.log('Valor al perder foco:', valorFormateado);
    });



    $('.bt-facturar').on('click', function(event) {
        event.preventDefault(); // Previene el comportamiento por defecto del botón
        var totalFactura = $('.Ptotal').text();
        var factura = $('.facturaN').text();

        // Recopilar datos de la tabla
        var filas = [];
        
        $('#tabla-formulario tbody tr').each(function() {
            var $fila = $(this);
            var producto = $fila.find('td:first').text().trim();
            var nombre = $fila.find('td:nth-child(2)').text().trim();
            var cantidad = $fila.find('.cantidad').text().trim();
            var precio =  desformatearNumero($fila.find('.entrada-precio').val());
            
            


            filas.push({
                producto: producto,
                nombre: nombre,
                cantidad: cantidad,
                precio: precio,
                
            });
            console.log('filas', filas)
        });

        if (!validarDatos(filas)) {
            alert('Por favor, complete todos los campos correctamente antes de enviar.');
            return; // Detiene el envío si la validación falla
        }
        var confirmar = confirm('¿Está seguro de que desea enviar los datos?');
                
                if (confirmar) {

                    // Enviar los datos al servidor usando AJAX
                    $.ajax({
                        url: Editados, // Cambia esto por la URL del endpoint que recibe los datos
                        type: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            "X-CSRFToken": getCookie("csrftoken")
                        },
                        contentType: 'application/json',
                        data: JSON.stringify({
                            filas: filas, totalFactura: totalFactura, factura: factura
                        }),
                        success: function(response) {
                            console.log('Datos enviados correctamente:', response);
                            // Puedes agregar aquí código para manejar la respuesta del servidor
                            location.reload();
                        },
                        error: function(xhr, status, error) {
                            console.error('Error al enviar los datos:', error);
                            // Puedes agregar aquí código para manejar el error
                        }
                    });
                }
        
    });

    function actualizarTotalAcumulado() {
        // Reinicia el total acumulado
        PrecioTotal = 0;
    
        // Recorre todas las filas y suma los totales
        $('#tabla-formulario .entrada-precio').each(function() {
            var inputElement = $(this);
            var valor = inputElement.val();
            var nuevoValor = desformatearNumero(valor); 
            var cantidad = parseFloat(inputElement.closest('tr').find('.cantidad').text()) || 0;
            console.log('valor tabla', nuevoValor)
    
            
            PrecioTotal += nuevoValor * cantidad;
            ivaSobreTotal = PrecioTotal*(19/100)
            subtotal = PrecioTotal - ivaSobreTotal
        });
    
        // Actualiza el total en el elemento .Ptotal
        $('.Ptotal').text(formatearNumero(PrecioTotal)); // Asegúrate de mostrar dos decimales
        $('.ValorIva').text(ivaSobreTotal.toLocaleString('es-ES',{
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }));
        $('.ValorSubtotal').text( subtotal.toLocaleString('es-ES',{
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }));
    }
    
    function desformatearNumero(valor) {
        // Reemplaza el separador de miles por vacío y el separador decimal por punto
        return parseFloat(valor.replace(/\./g, '').replace(',', '.')) || 0;
    }

    function validarDatos(filas) {
        for (var i = 0; i < filas.length; i++) {
            var fila = filas[i];
            if (!fila.producto || !fila.nombre || !fila.cantidad || isNaN(fila.precio) || fila.precio <= 0) {
                return false; // Si algún campo es vacío o inválido, devuelve false
            }
        }
        return true; // Todos los datos son válidos
    }
    

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



