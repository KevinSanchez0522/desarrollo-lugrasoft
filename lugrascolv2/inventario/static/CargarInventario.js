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
                'X-CSRF-TOKEN': getCookie('csrftoken')
            },
            success: function(response) {
                console.log(data);
                if (response.error){
                    console.error('Error', response.error)
                    return;
                }
            },
            error:function(xhr,status,error){
                $('#result').text('Error: ' + error);
            }

        })
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