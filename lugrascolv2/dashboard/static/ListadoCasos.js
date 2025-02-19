document.addEventListener('DOMContentLoaded', function(){

    $(document).on('click', '#input-resuelto', function(){
        
        var identificador = $(this).data('id')
        var usuario = $(this).data('user')

        console.log('Usuario:', usuario);
        console.log('ID Caso:', identificador);

        if(usuario == 'KevinDev'){
            console.log('eres kevin')
            if(confirm('Seguro quieres cambiar el estado de Caso?')){

                $.ajax({
                    type: 'POST',
                    url : CambiarEstado,
                    data: {
                        id: identificador,
                    },
                    headers:{'X-CSRFToken': getCookie('csrftoken')},
                    success: function(response){
                        console.log(response);
                        if(response.status == 'success')
                            alert('Caso resuelto con exito');
                        else
                        alert('Error al resuelto el caso');
                    },
                    error: function(xhr, status, error) {
                        console.error('Error al procesar El caso', error)
                        }

                })
            }
        else{
            alert('No tienes permisos para realizar esta accion');
        }
        }
    })
})