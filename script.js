// script.js
let fechaActual = new Date();
let eventos = JSON.parse(localStorage.getItem('eventos')) || {};
let categorias = JSON.parse(localStorage.getItem('categorias')) || ['Trabajo', 'Personal', 'Estudio', 'Otro'];
let colores = JSON.parse(localStorage.getItem('colores')) || {};
let vistaActual = 'mes';
let diaSeleccionado = null;

// Generar color para categorías personalizadas
function generarColor() {
    const letras = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letras[Math.floor(Math.random() * 16)];
    }
    return color;
}

// Actualizar opciones de categorías
function actualizarCategorias() {
    const selectCategoria = document.getElementById('evento-categoria');
    const filtroCategoria = document.getElementById('filtro-categoria');
    selectCategoria.innerHTML = categorias.map(cat => `<option value="${cat}">${cat}</option>`).join('');
    filtroCategoria.innerHTML = '<option value="todos">Todos</option>' + categorias.map(cat => `<option value="${cat}">${cat}</option>`).join('');
}

// Generar estilos dinámicos para categorías
function actualizarEstilosCategorias() {
    let styleSheet = document.getElementById('categorias-dinamicas');
    if (!styleSheet) {
        styleSheet = document.createElement('style');
        styleSheet.id = 'categorias-dinamicas';
        document.head.appendChild(styleSheet);
    }
    styleSheet.innerHTML = categorias.map(cat => {
        if (!['Trabajo', 'Personal', 'Estudio', 'Otro'].includes(cat)) {
            if (!colores[cat]) {
                colores[cat] = generarColor();
                guardarColores();
            }
            return `.evento-item.${cat.replace(/\s/g, '_')} { border-left: 5px solid ${colores[cat]}; }`;
        }
        return '';
    }).join('');
}

function generarCalendario() {
    const mesActual = document.getElementById('mes-actual');
    const dias = document.getElementById('dias');
    const vistaSemana = document.getElementById('contenedor-vista-semana');
    const vistaDia = document.getElementById('contenedor-vista-dia');
    const diasSemana = document.getElementById('dias-semana');

    dias.style.display = vistaActual === 'mes' ? 'grid' : 'none';
    vistaSemana.style.display = vistaActual === 'semana' ? 'block' : 'none';
    vistaDia.style.display = vistaActual === 'dia' ? 'block' : 'none';
    diasSemana.style.display = vistaActual === 'mes' || vistaActual === 'semana' ? 'flex' : 'none';

    const mes = fechaActual.getMonth();
    const año = fechaActual.getFullYear();
    mesActual.textContent = `${new Date(año, mes).toLocaleString('es-ES', { month: 'long' })} ${año}`;

    if (vistaActual === 'mes') {
        dias.innerHTML = ''; // Limpiar contenido previo
        const primerDia = new Date(año, mes, 1).getDay();
        const diasEnMes = new Date(año, mes + 1, 0).getDate();
        const hoy = new Date().getDate();
        const mesHoy = new Date().getMonth();
        const añoHoy = new Date().getFullYear();

        // Añadir días vacíos antes del 1
        for (let i = 0; i < primerDia; i++) {
            const diaVacio = document.createElement('div');
            diaVacio.classList.add('dia');
            dias.appendChild(diaVacio);
        }

        // Añadir días del mes
        for (let i = 1; i <= diasEnMes; i++) {
            const dia = document.createElement('div');
            dia.classList.add('dia', 'btn', 'btn-light', 'text-center', 'p-2');
            dia.textContent = i;
            const clave = `${año}-${mes + 1}-${i}`;
            if (eventos[clave] && eventos[clave].length > 0) {
                dia.classList.add('evento');
            }
            if (i === hoy && mes === mesHoy && año === añoHoy) {
                dia.classList.add('hoy');
            }
            dia.addEventListener('click', () => {
                diaSeleccionado = clave;
                mostrarEventos(clave, i);
            });
            dias.appendChild(dia);
        }
    } else if (vistaActual === 'semana') {
        let html = '<h3 class="mb-3">Vista Semanal</h3><div class="row">';
        const inicioSemana = new Date(fechaActual);
        inicioSemana.setDate(fechaActual.getDate() - fechaActual.getDay());
        for (let i = 0; i < 7; i++) {
            const dia = new Date(inicioSemana);
            dia.setDate(inicioSemana.getDate() + i);
            const clave = `${dia.getFullYear()}-${dia.getMonth() + 1}-${dia.getDate()}`;
            const claseEvento = (eventos[clave] && eventos[clave].length > 0) ? 'evento' : '';
            const claseHoy = (dia.getDate() === new Date().getDate() && dia.getMonth() === new Date().getMonth() && dia.getFullYear() === new Date().getFullYear()) ? 'hoy' : '';
            html += `<div class="col dia btn btn-light text-center p-2 ${claseEvento} ${claseHoy}" data-clave="${clave}" data-dia="${dia.getDate()}">${dia.getDate()} ${dia.toLocaleString('es-ES', { weekday: 'short' })}</div>`;
        }
        html += '</div>';
        vistaSemana.innerHTML = html;
        // Añadir event listeners a los días generados
        const diasGenerados = vistaSemana.querySelectorAll('.dia');
        diasGenerados.forEach(diaDiv => {
            diaDiv.addEventListener('click', () => {
                const clave = diaDiv.getAttribute('data-clave');
                const dia = parseInt(diaDiv.getAttribute('data-dia'));
                diaSeleccionado = clave;
                mostrarEventos(clave, dia);
            });
        });
    } else if (vistaActual === 'dia') {
        const titulo = `${fechaActual.getDate()} de ${new Date(fechaActual.getFullYear(), fechaActual.getMonth()).toLocaleString('es-ES', { month: 'long' })} ${fechaActual.getFullYear()}`;
        vistaDia.innerHTML = `<h3 class="mb-3">${titulo}</h3>`;
        const clave = `${fechaActual.getFullYear()}-${fechaActual.getMonth() + 1}-${fechaActual.getDate()}`;
        mostrarEventos(clave, fechaActual.getDate());
    }
}

function mostrarEventos(clave, dia) {
    const form = document.getElementById('evento-form');
    const titulo = document.getElementById('evento-titulo');
    const lista = document.getElementById('evento-lista');
    const nombre = document.getElementById('evento-nombre');
    const fecha = document.getElementById('evento-fecha');
    const categoria = document.getElementById('evento-categoria');
    const desc = document.getElementById('evento-desc');
    const filtroCategoria = document.getElementById('filtro-categoria');

    titulo.textContent = `Eventos para el ${dia} de ${new Date(fechaActual.getFullYear(), fechaActual.getMonth()).toLocaleString('es-ES', { month: 'long' })}`;
    lista.innerHTML = '';
    nombre.value = '';
    fecha.value = '';
    categoria.value = categorias[0] || 'Trabajo';
    desc.value = '';

    if (!eventos[clave]) {
        eventos[clave] = [];
    }

    const eventosFiltrados = eventos[clave].filter(evento => filtroCategoria.value === 'todos' || evento.categoria === filtroCategoria.value);
    eventosFiltrados.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    eventosFiltrados.forEach((evento) => {
        const indexReal = eventos[clave].indexOf(evento); // Obtener el índice real en el array original
        const item = document.createElement('div');
        item.classList.add('evento-item', 'card', 'mb-2', 'animate__animated', 'animate__fadeInUp', evento.categoria.replace(/\s/g, '_'));
        item.innerHTML = `
            <div class="card-body">
                <h5 class="card-title">${evento.nombre || 'Sin nombre'}</h5>
                <p class="card-text">${evento.desc || 'Sin descripción'}</p>
                <small class="text-muted">${evento.fecha ? new Date(evento.fecha).toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit' }) : 'Sin fecha'} - ${evento.categoria}</small>
            </div>
        `;
        const btnEditar = document.createElement('button');
        btnEditar.textContent = 'Editar';
        btnEditar.classList.add('btn', 'btn-warning', 'btn-sm', 'me-2');
        btnEditar.addEventListener('click', () => {
            nombre.value = evento.nombre || '';
            fecha.value = evento.fecha ? evento.fecha.slice(0, 16) : '';
            categoria.value = evento.categoria;
            desc.value = evento.desc || '';
            document.getElementById('guardar-evento').onclick = () => {
                if (true) { // Validación relajada: siempre permite guardar (puedes llenar campos vacíos)
                    eventos[clave][indexReal] = { nombre: nombre.value, fecha: fecha.value, categoria: categoria.value, desc: desc.value };
                    guardarEventos();
                    programarRecordatorio(clave, { nombre: nombre.value, fecha: fecha.value, categoria: categoria.value, desc: desc.value });
                    mostrarEventos(clave, dia);
                    generarCalendario();
                }
            };
        });
        const btnEliminar = document.createElement('button');
        btnEliminar.textContent = 'Eliminar';
        btnEliminar.classList.add('btn', 'btn-danger', 'btn-sm');
        btnEliminar.addEventListener('click', () => {
            eventos[clave].splice(indexReal, 1);
            guardarEventos();
            mostrarEventos(clave, dia);
            generarCalendario();
        });
        item.querySelector('.card-body').appendChild(btnEditar);
        item.querySelector('.card-body').appendChild(btnEliminar);
        lista.appendChild(item);
    });

    form.style.display = 'block';
    form.classList.add('animate__animated', 'animate__fadeIn');
    document.getElementById('guardar-evento').onclick = () => {
        if (true) { // Validación relajada: siempre permite guardar
            eventos[clave].push({ nombre: nombre.value, fecha: fecha.value, categoria: categoria.value, desc: desc.value });
            guardarEventos();
            programarRecordatorio(clave, { nombre: nombre.value, fecha: fecha.value, categoria: categoria.value, desc: desc.value });
            mostrarEventos(clave, dia);
            generarCalendario();
        }
    };
}

function guardarEventos() {
    localStorage.setItem('eventos', JSON.stringify(eventos));
}

function guardarCategorias() {
    localStorage.setItem('categorias', JSON.stringify(categorias));
}

function guardarColores() {
    localStorage.setItem('colores', JSON.stringify(colores));
}

function programarRecordatorio(clave, evento) {
    if ('Notification' in window && Notification.permission === 'granted') {
        const fechaEvento = new Date(evento.fecha);
        const ahora = new Date();
        const diff = fechaEvento - ahora;
        if (diff > 0) {
            setTimeout(() => {
                new Notification(`Recordatorio: ${evento.nombre} [${evento.categoria}]`, {
                    body: `${evento.desc} a las ${fechaEvento.toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit' })}`,
                });
            }, diff);
        }
    }
}

// Solicitar permiso para notificaciones
if ('Notification' in window && Notification.permission !== 'granted') {
    Notification.requestPermission();
}

// Agregar nueva categoría
document.getElementById('agregar-categoria').addEventListener('click', () => {
    const nuevaCategoria = document.getElementById('nueva-categoria').value.trim();
    if (nuevaCategoria && !categorias.includes(nuevaCategoria)) {
        categorias.push(nuevaCategoria);
        if (!colores[nuevaCategoria]) {
            colores[nuevaCategoria] = generarColor();
        }
        guardarCategorias();
        guardarColores();
        actualizarCategorias();
        actualizarEstilosCategorias();
        document.getElementById('nueva-categoria').value = '';
    }
});

document.getElementById('prev-mes').addEventListener('click', () => {
    if (vistaActual === 'mes') {
        fechaActual.setMonth(fechaActual.getMonth() - 1);
    } else if (vistaActual === 'semana') {
        fechaActual.setDate(fechaActual.getDate() - 7);
    } else {
        fechaActual.setDate(fechaActual.getDate() - 1);
    }
    generarCalendario();
    document.getElementById('evento-form').style.display = 'none';
    document.getElementById('evento-form').classList.remove('animate__animated', 'animate__fadeIn');
});

document.getElementById('next-mes').addEventListener('click', () => {
    if (vistaActual === 'mes') {
        fechaActual.setMonth(fechaActual.getMonth() + 1);
    } else if (vistaActual === 'semana') {
        fechaActual.setDate(fechaActual.getDate() + 7);
    } else {
        fechaActual.setDate(fechaActual.getDate() + 1);
    }
    generarCalendario();
    document.getElementById('evento-form').style.display = 'none';
    document.getElementById('evento-form').classList.remove('animate__animated', 'animate__fadeIn');
});

document.getElementById('vista-mes').addEventListener('click', () => {
    vistaActual = 'mes';
    generarCalendario();
    document.getElementById('evento-form').style.display = 'none';
    document.getElementById('evento-form').classList.remove('animate__animated', 'animate__fadeIn');
});

document.getElementById('vista-semana').addEventListener('click', () => {
    vistaActual = 'semana';
    generarCalendario();
    document.getElementById('evento-form').style.display = 'none';
    document.getElementById('evento-form').classList.remove('animate__animated', 'animate__fadeIn');
});

document.getElementById('vista-dia').addEventListener('click', () => {
    vistaActual = 'dia';
    generarCalendario();
});

document.getElementById('filtro-categoria').addEventListener('change', () => {
    const clave = `${fechaActual.getFullYear()}-${fechaActual.getMonth() + 1}-${fechaActual.getDate()}`;
    mostrarEventos(clave, fechaActual.getDate());
});

// Inicializar categorías y calendario
actualizarCategorias();
actualizarEstilosCategorias();
generarCalendario();