document.addEventListener('DOMContentLoaded', function () {

    console.log("JS CARGADO");

    $('#GuardarPrecios').on('click', function (e) {

        e.preventDefault();

        console.log("CLICK DETECTADO");

        const datos = [];

        $('.input-precio').each(function () {

            datos.push({

                idtabla: $(this).data('tabla'),

                nombre: $(this).data('nombre'),

                valor: $(this).val() || 0

            });

        });

        console.log("DATOS A ENVIAR:", datos);

        $.ajax({

            type: "POST",

            url: ActualizarLista,

            data: JSON.stringify(datos),

            contentType: "application/json",

            headers: {

                "X-CSRFToken": getCookie('csrftoken'),

            },

            success: function (response) {

                console.log("RESPUESTA:", response);

                alert("Precios actualizados correctamente");

            },

            error: function (xhr, status, error) {

                console.log("ERROR AJAX");

                console.log(xhr.responseText);

                console.log(status);

                console.log(error);

                alert("Error al guardar");

            }

        });

    });

});

$(document).on('click', '.btn-agregar-producto', function () {

    const idtabla = $(this).data('tabla');

    const nombre = prompt(
        'Ingrese el nombre de la nueva presentación'
    );

    if (!nombre) return;

    const nuevoInput = `

        <div class="item-precio">

            <label>${nombre.toUpperCase()}</label>

            <input
                type="number"
                class="input-precio"
                data-tabla="${idtabla}"
                data-nombre="${nombre.toUpperCase()}"
                value="0"
                placeholder="Ingrese precio"
            >

        </div>
    `;

    $(this)
        .closest('.card-linea')
        .find('.productos-grid')
        .append(nuevoInput);

});

function getCookie(name) {

    let cookieValue = null;

    if (document.cookie && document.cookie !== '') {

        const cookies = document.cookie.split(';');

        for (let i = 0; i < cookies.length; i++) {

            const cookie = cookies[i].trim();

            if (cookie.substring(0, name.length + 1) === (name + '=')) {

                cookieValue = decodeURIComponent(

                    cookie.substring(name.length + 1)

                );

                break;

            }

        }

    }

    return cookieValue;
}