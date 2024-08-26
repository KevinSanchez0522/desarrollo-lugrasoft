document.addEventListener('DOMContentLoaded', function(){
    const tabButtons = document.querySelectorAll(".tab-button");
    const tabContents = document.querySelectorAll(".tab-content");
    

    function mostrarPestanaActiva() {
        // Mostrar la pestaña de la tabla por defecto
        document.getElementById("tabla-content").classList.add("active");
        document.querySelector(".tab-button[data-tab='tabla-content']").classList.add("active");
    }

    tabButtons.forEach(button => {
        button.addEventListener("click", function() {
            // Ocultar todas las pestañas y desactivar botones
            tabButtons.forEach(btn => btn.classList.remove("active"));
            tabContents.forEach(content => content.classList.remove("active"));

            // Mostrar la pestaña correspondiente al botón clickeado
            const tabId = this.getAttribute("data-tab");
            document.getElementById(tabId).classList.add("active");
            this.classList.add("active");

        
        });
    });
    
    actualizarTablaMateriasPrimas();
    

    // Objeto para almacenar la cantidad total de cada materia prima
    var materiasTotales = {}; // Inicializar como un objeto vacío
    

    function limpiarTablaMateriasPrimas() {
        // Limpiar el objeto de materias totales
        materiasTotales = {};
        // Limpiar la tabla de materias primas
        var tbodyMateriasPrimas = document.getElementById('materias-primas-table').getElementsByTagName('tbody')[0];
        tbodyMateriasPrimas.innerHTML = '';
    }

    function cargarMateriasPrimasPorProducto(codInventario, cantidad) {
        return new Promise(function(resolve, reject) {
            // Lógica de carga de materias primas aquí, similar a tu implementación actual
            // ...
            if (!codInventario || cantidad <= 0) {
                console.error('Parámetros inválidos para cargar materias primas por producto.');
                return;
            }
    
            $.ajax({
                url: VerMateriasPrimas,
                type: 'GET',
                data: {
                    producto_id: codInventario
                },
                success: function(response) {
                    if (response.success) {
                        
                        var materiasPrimas = response.materias_primas;
    
                        materiasPrimas.forEach(function(materiaPrima) {
                            // Multiplicar la cantidad requerida por la cantidad del producto
                            var cantidadRequeridaTotal = materiaPrima.cantidad_requerida * cantidad;
    
                            // Verificar si la materia prima ya está en materiasTotales
                            if (materiasTotales.hasOwnProperty(materiaPrima.codigo)) {
                                // Sumar las cantidades requeridas
                                materiasTotales[materiaPrima.codigo].cantidadRequerida += cantidadRequeridaTotal;
                            } else {
                                // Agregar la materia prima a materiasTotales
                                materiasTotales[materiaPrima.codigo] = {
                                    nombre: materiaPrima.nombre,
                                    cantidadRequerida: cantidadRequeridaTotal,
                                    cantidadActual: materiaPrima.cantidad_actual
                                };
                            }
                        });
                        // Actualizar la tabla de materias primas
                        actualizarTablaMateriasPrimas();
                    } else {
                        console.error('Error al obtener las materias primas:', response.error);
                    }
                },
                error: function(xhr, status, error) {
                    console.error('Error en la solicitud AJAX:', status, error);
                }
            });
            // Al finalizar exitosamente
            resolve(materiasTotales); // Puedes pasar materiasTotales si es necesario
            // En caso de error, puedes llamar a reject(error);
        });

    }

    function actualizarTablaMateriasPrimas() {
        var tbodyMateriasPrimas = document.getElementById('materias-primas-table').getElementsByTagName('tbody')[0];
        tbodyMateriasPrimas.innerHTML = '';
    
        for (var codigo in materiasTotales) {
            if (Object.prototype.hasOwnProperty.call(materiasTotales, codigo)) {
                var materiaPrima = materiasTotales[codigo];
                var row = tbodyMateriasPrimas.insertRow();
                var cellCodigo = row.insertCell(0);
                var cellNombre = row.insertCell(1);
                var cellCantidadRequerida = row.insertCell(2);
                var cellCantidadActual = row.insertCell(3);
    
                cellCodigo.innerHTML = codigo;
                cellNombre.innerHTML = materiaPrima.nombre;
                cellCantidadRequerida.innerHTML = materiaPrima.cantidadRequerida;
                cellCantidadActual.innerHTML = materiaPrima.cantidadActual;
            }
        }
    }

    mostrarPestanaActiva();

    $(document).ready(function() {
        var idOrden; // Variable global para almacenar el ID de la orden
        var estado;
        detalles = [];
        // Verificar si el botón 'Producir' debe estar deshabilitado al cargar la página
       
    
        // Función para abrir el modal de detalles de la orden
        $('.open-modal').on('click', function(event) {
            event.preventDefault();
            idOrden = $(this).data('id'); // Captura el ID de la orden desde el botón
    
            // Mostrar el modal de detalles de la orden
            $('#modalDetalleOrden').show();
            limpiarTablaMateriasPrimas();
    
            // Realizar la solicitud AJAX para obtener detalles de la orden
            $.ajax({
                url: DetalleOrden.replace('0', idOrden),
                type: 'GET',
                success: function(response) {
                    detalles = response.detalles;
                    
                    var tbody = document.getElementById('tabla-detalles').getElementsByTagName('tbody')[0];
                    tbody.innerHTML = ''; // Limpiar el cuerpo de la tabla
    
                    detalles.forEach(function(detalle) {
                        // Insertar detalles en la tabla modal
                        $('#responsableEtiquetado').text(detalle.responsable);
                        $('#estado').text(detalle.estado)
                        var row = tbody.insertRow();
                        var cellProducto = row.insertCell(0);
                        var cellNombre = row.insertCell(1);
                        var cellCantidad = row.insertCell(2);

    
                        cellProducto.innerHTML = detalle.cod_inventario;
                        cellNombre.innerHTML = detalle.nombre;
                        cellCantidad.innerHTML = detalle.cantidad;
                        estado = detalle.estado;
                        console.log('estado: ', estado)
                        console.log('detalles de orden:', detalles)
    
                        // Llamar a la función para cargar las materias primas de este producto
                        cargarMateriasPrimasPorProducto(detalle.cod_inventario, detalle.cantidad);
                    });
    
                    // Actualizar la tabla de materias primas una vez cargados todos los detalles
                    actualizarTablaMateriasPrimas();
                    console.log("Materias primas totales:", materiasTotales);

                     // Verificar y deshabilitar el botón 'Producir' si el estado es 'En producción'
                    if (response.estado === 'En producción') {
                        $('#bt-producir').prop('disabled', true);
                    }
                    if(response.estado === 'por facturar') {
                        $('#bt-facturacion').prop('disabled', true);
                    }
    
                    // Mostrar el modal después de cargar los detalles
                    $('#modalDetalleOrden').show();
                },
                error: function(xhr, status, error) {
                    console.error(xhr.responseText);
                }
            });
        });
    
        // Botón para producir
        $('#bt-producir').on('click', function(event) {
            event.preventDefault();
            console.log('estado: ', estado)
            var fecha = obtenerFechaActual().toISOString().split('T')[0];
            
            
    
            // Verificar que idOrden esté definido y válido
            if (!idOrden) {
                console.error('ID de orden no válido.');
                return;
            }
            
            if (estado !== 'creado') {
                alert('La orden no se puede producir en su estado actual.');
                return;
            }
            // Obtener las materias primas totales para la orden específica
            var datosMateriasPrimas = materiasTotales; // Suponiendo que `materiasTotales` está disponible globalmente
            console.log('Datos a enviar:', datosMateriasPrimas);
            console.log('fecha actual:', fecha)

            // Confirmación antes de enviar los datos
            if (!confirm('¿Estás seguro de enviar los datos?')) {
                return;
            }
    
            // Realizar la solicitud AJAX para producir
            $.ajax({
                url: Producir,
                type: 'POST',
                headers: { 'X-CSRFToken': getCookie('csrftoken') },
                data: {
                    id_orden: idOrden,
                    materias_primas_totales: JSON.stringify(datosMateriasPrimas),
                    CambiarEstado: 'en proceso',
                    fecha: fecha,
                },
                success: function(response) {
                    alert('Datos enviados correctamente.');
                    // Manejar la respuesta si es necesario
                    console.log('ID de la orden:', idOrden);
                    $('#bt-producir').prop('disabled', true);
                    location.reload(); 
                },
                error: function(xhr, status, error) {
                    alert('Error al enviar los datos: ' + error);
                }
            });
        });
        $('#bt-facturacion').on('click', function(event) {
            event.preventDefault();
            var fecha = obtenerFechaActual().toISOString().split('T')[0];
            // Verificar que idOrden esté definido y válido
            if (!idOrden) {
                console.error('ID de orden no válido.');
                return;
            }
            
            if (estado !== 'en proceso') {
                alert('La orden no se puede enviar a facturacion en su estado actual.');
                return;
            }
            
            if (!confirm('¿Estás seguro de enviar los datos?')) {
                return;
            }

            $.ajax({
                url: IrAFacturar,
                type: 'POST',
                headers: {'X-CSRFToken': getCookie('csrftoken')},
                data: {
                    id_orden: idOrden,
                    CambiarEstado: 'por facturar',
                    fecha: fecha,
                },
                success: function (response){
                    alert('Datos enviados correctamente')
                    console.log('elementos de la orden:', detalles)
                    console.log('id de la orden:', idOrden)
                    $('#bt-facturacion').prop('disabled', true)
                    location.reload();

                }
            })

        });
    
        
        // Cerrar modal al hacer clic en el botón de cerrar (×)
        $('.close').on('click', function() {
            $('#modalDetalleOrden').hide();
        });
    
        // Cerrar modal al hacer clic fuera de él
        $(window).on('click', function(event) {
            if (event.target == $('#modalDetalleOrden')[0]) {
                $('#modalDetalleOrden').hide();
            }
        });
    });

    
        
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
function obtenerFechaActual() {
    // Obtener la fecha y hora actuales en UTC
    var fechaActual = new Date();
    
    // Obtener el desplazamiento horario en minutos desde UTC para la zona horaria de Colombia (UTC-5)
    var offsetColombia = -5 * 60;
    
    // Calcular la fecha y hora en la zona horaria de Colombia
    var fechaColombia = new Date(fechaActual.getTime() + offsetColombia * 60 * 1000);
    
    return fechaColombia;
}