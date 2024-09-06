document.addEventListener('DOMContentLoaded', function() {
    const modal2 = document.getElementById('miModal2');
    const closeModal2 = document.querySelector('.closemodal2');
    const editLinks = document.querySelectorAll('.edit-link');
    
    // Función para abrir el modal y cargar datos
    function openModal(event) {
        event.preventDefault(); // Evitar que el enlace navegue a otra página
        
        // Obtener los datos del cliente desde los atributos de datos del enlace
        const link = event.currentTarget;
        const nit = link.getAttribute('data-nit');
        const nombre = link.getAttribute('data-nombre');
        const direccion = link.getAttribute('data-direccion');
        const telefono = link.getAttribute('data-telefono');
        const email = link.getAttribute('data-email');
        
        // Rellenar el formulario con los datos del cliente
        document.getElementById('nit').value = nit;
        document.getElementById('nombreproveedor').value = nombre;
        document.getElementById('direccion').value = direccion;
        document.getElementById('telefono').value = telefono;
        document.getElementById('email').value = email;
        
        // Mostrar el modal
        modal2.style.display = 'block';
    }
    
    // Función para cerrar el modal
    function closeModal() {
        modal2.style.display = 'none';
    }
    
    // Agregar evento de clic a todos los enlaces con la clase .edit-link
    editLinks.forEach(function(link) {
        link.addEventListener('click', openModal);
    });

    // Agregar evento de clic al botón de cierre del modal
    closeModal2.addEventListener('click', closeModal);
    
    // Cerrar el modal si se hace clic fuera del contenido del modal
    window.addEventListener('click', function(event) {
        if (event.target === modal2) {
            closeModal();
        }
    });
});
