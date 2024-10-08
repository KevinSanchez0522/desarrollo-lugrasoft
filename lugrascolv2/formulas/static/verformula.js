document.addEventListener('DOMContentLoaded', function () {
    const openModalButtons = document.querySelectorAll('.open-modal');
    const closeModalButtons = document.querySelectorAll('.close-modal');
    const overlay = document.querySelector('.modal');

    openModalButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modal = document.querySelector(button.dataset.modalTarget);
            openModal(modal);
        });
    });

    closeModalButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal');
            closeModal(modal);
        });
    });

    overlay.addEventListener('click', () => {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            closeModal(modal);
        });
    });

    function openModal(modal) {
        if (modal == null) return;
        modal.style.display = 'block';
    }

    function closeModal(modal) {
        if (modal == null) return;
        modal.style.display = 'none';
    }

    // Controlador de evento para el botón de enviar
        const btnEnviar = document.querySelectorAll('[id^="btnEnviar"]');
        btnEnviar.forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal');
            
            // Obtener los valores de los campos del modal
            const costosIndirectos = document.querySelector(`#costos${modal.id.replace('editModal', '')}`).value;
            const utilidad = document.querySelector(`#utilidad${modal.id.replace('editModal', '')}`).value;
            const iva = document.querySelector(`#iva${modal.id.replace('editModal', '')}`).value;
            const cantidadInputs = modal.querySelectorAll('tbody input[type="number"]');
            const cantidades = Array.from(cantidadInputs).map(input => input.value);
            const transformulasId = button.dataset.formulaId; 
            
            
    
            

        

            // Crear un objeto con los datos a enviar
            const data = {
                transformulasId: transformulasId,
                costosIndirectos: costosIndirectos,
                utilidad: utilidad,
                iva: iva,
                cantidades: cantidades,
                nombre : nombreEdit
                // Agrega aquí los demás datos que desees enviar
            };
            console.log(data);

            if (confirm('¿Estás seguro de que deseas enviar estos datos?')) {
            // Enviar los datos mediante AJAX
                $.ajax({
                    url: "{% url 'actualizar_transformula'%}",
                    type: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        "X-CSRFToken": getCookie("csrftoken") 
                    },
                    data: JSON.stringify(data),
                    success: function(response) {
                        // Manejar la respuesta del servidor si es necesario
                        console.log('Datos enviados correctamente:', response);
                        closeModal(modal);
                        window.location.reload();
                    },
                    error: function(xhr, errmsg, err) {
                        // Manejar errores en la solicitud AJAX
                        console.error('Error al enviar los datos:', errmsg);
                    }
                })
            }else{
                // Si el usuario cancela, no hacer nada
                console.log('Envío cancelado por el usuario');
            }    
        })
    })
    
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

