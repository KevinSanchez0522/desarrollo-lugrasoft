document.addEventListener('DOMContentLoaded' ,function(){
    function obtenerDatosDeTabla(selector) {
        const datos = {}; // Objeto para almacenar los datos
    
        // Recorrer todos los inputs dentro de la tabla
        $(selector).find('input[type="number"]').each(function() {
            const nombre = $(this).attr('name'); // Obtener el nombre del campo
            const valor = $(this).val();        // Obtener el valor del campo
            datos[nombre] = valor;             // Agregar al objeto
        });
    
        return datos; // Retornar el objeto con los datos
    }

    function validarDatos(...tablas) {
        for(const tabla of tablas){
            for (const key in tabla) {
                if (tabla[key] === "" || isNaN(tabla[key])) {
                    alert(`El campo ${key} no tiene un valor válido.`);
                    return false;
                }
            }

        }

        return true;
    }

        // Función para convertir un objeto en un array de objetos
    const convertirTablaAArray = (datosTabla) => {
        return Object.keys(datosTabla).map(key => {
            return {
                nombre: key,
                valor: datosTabla[key]
            };
        });
    };

    $('#GuardarPrecios').on('click', function(){

        const datosTabla1 = obtenerDatosDeTabla('#tabla1');
        const datosTabla2 = obtenerDatosDeTabla('#tabla2');
        const datosTabla3 = obtenerDatosDeTabla('#tabla3');
        const datosTabla4 = obtenerDatosDeTabla('#tabla4');
        const datosTabla5 = obtenerDatosDeTabla('#tabla5');
        const datosTabla6 = obtenerDatosDeTabla('#tabla6');
        const datosTabla7 = obtenerDatosDeTabla('#tabla7');
        const datosTabla8 = obtenerDatosDeTabla('#tabla8');
        const datosTabla9 = obtenerDatosDeTabla('#tabla9');
        const datosTabla10 = obtenerDatosDeTabla('#tabla10');

        // Convertir todas las tablas en arrays de objetos
        const datosTabla1Array = convertirTablaAArray(datosTabla1);
        const datosTabla2Array = convertirTablaAArray(datosTabla2);
        const datosTabla3Array = convertirTablaAArray(datosTabla3);
        const datosTabla4Array = convertirTablaAArray(datosTabla4);
        const datosTabla5Array = convertirTablaAArray(datosTabla5);
        const datosTabla6Array = convertirTablaAArray(datosTabla6);
        const datosTabla7Array = convertirTablaAArray(datosTabla7);
        const datosTabla8Array = convertirTablaAArray(datosTabla8);
        const datosTabla9Array = convertirTablaAArray(datosTabla9);
        const datosTabla10Array = convertirTablaAArray(datosTabla10);


        
        if(validarDatos(datosTabla1,datosTabla2)){
            DatosCompletos = {
                "Tabla1": datosTabla1Array,
                "Tabla2": datosTabla2Array,
                "Tabla3": datosTabla3Array,
                "Tabla4": datosTabla4Array,
                "Tabla5": datosTabla5Array,
                "Tabla6": datosTabla6Array,
                "Tabla7": datosTabla7Array,
                "Tabla8": datosTabla8Array,
                "Tabla9": datosTabla9Array,
                "Tabla10": datosTabla10Array
            }
            console.log('datos completos',DatosCompletos)
            $.ajax({
                type: "POST",
                url: ActualizarLista,
                data: JSON.stringify(DatosCompletos),
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                headers: {
                    "X-CSRFToken": getCookie('csrftoken'),
                },
                success: function (response) {
                    console.log(response);
                    alert("Los precios se han actualizado correctamente");
                    window.location.reload();
                    
                    },
                    error: function (xhr, status, error) {
                        console.error('error al guardar la lista de precios', error)
                        }
                    });
                    
                }

        
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