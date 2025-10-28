// script.js - versión corregida y completa

// ---- Estado inicial ----
let fechaActual = new Date();
let eventos = JSON.parse(localStorage.getItem('eventos')) || {}; // { "2025-10-28": [{nombre, fecha, categoria, desc}, ...], ... }
let categorias = JSON.parse(localStorage.getItem('categorias')) || ['Trabajo', 'Personal', 'Estudio', 'Otro'];
let colores = JSON.parse(localStorage.getItem('colores')) || {}; // { "Nombre Cat": "#AABBCC" }
let vistaActual = 'mes';
let diaSeleccionado = null;
let editando = { activo: false, indice: null, clave: null };

// ---- Utilidades ----
function generarColor() {
    const letras = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) color += letras[Math.floor(Math.random() * 16)];
    return color;
}

function guardarEventos() { localStorage.setItem('eventos', JSON.stringify(eventos)); }
function guardarCategorias() { localStorage.setItem('categorias', JSON.stringify(categorias)); }
function guardarColores() { localStorage.setItem('colores', JSON.stringify(colores)); }

// Devuelve clave ISO "YYYY-MM-DD" para evitar problemas con meses 0-11
function claveISO(dateObj) {
    return dateObj.toISOString().split('T')[0];
}

function claveDesdeParts(yyyy, mm1, dd) { // mm1 = 1..12 as used in UI keys
    const mm0 = Number(mm1) - 1;
    const d = new Date(Number(yyyy), mm0, Number(dd));
    return claveISO(d);
}

// ---- Categorías dinámicas y estilos ----
function actualizarCategorias() {
    const selectCategoria = document.getElementById('evento-categoria');
    const filtroCategoria = document.getElementById('filtro-categoria');
    if (!selectCategoria || !filtroCategoria) return;
    selectCategoria.innerHTML = categorias.map(cat => `<option value="${cat}">${cat}</option>`).join('');
    filtroCategoria.innerHTML = '<option value="todos">Todos</option>' + categorias.map(cat => `<option value="${cat}">${cat}</option>`).join('');
}

function actualizarEstilosCategorias() {
    let styleSheet = document.getElementById('categorias-dinamicas');
    if (!styleSheet) {
        styleSheet = document.createElement('style');
        styleSheet.id = 'categorias-dinamicas';
        document.head.appendChild(styleSheet);
    }
    // Aseguramos color para cada categoría y generamos reglas CSS
    categorias.forEach(cat => {
        if (!colores[cat]) colores[cat] = generarColor();
    });
    guardarColores();
    const reglas = categorias.map(cat => {
        const safeClass = cat.replace(/\s/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
        return `.evento-item.${safeClass} { border-left: 5px solid ${colores[cat]}; }`;
    }).join('\n');
    styleSheet.innerHTML = reglas;
}

// ---- Generador de calendario (mes / semana / dia) ----
function generarCalendario() {
    const mesActual = document.getElementById('mes-actual');
    const contDias = document.getElementById('dias');
    const contSemana = document.getElementById('contenedor-vista-semana');
    const contDia = document.getElementById('contenedor-vista-dia');
    const diasSemana = document.getElementById('dias-semana');

    // Mostrar/ocultar contenedores segun vista
    if (contDias) contDias.style.display = vistaActual === 'mes' ? 'grid' : 'none';
    if (contSemana) contSemana.style.display = vistaActual === 'semana' ? 'block' : 'none';
    if (contDia) contDia.style.display = vistaActual === 'dia' ? 'block' : 'none';
    if (diasSemana) diasSemana.style.display = (vistaActual === 'mes' || vistaActual === 'semana') ? 'flex' : 'none';

    const mes = fechaActual.getMonth(); // 0..11
    const año = fechaActual.getFullYear();
    if (mesActual) mesActual.textContent = `${new Date(año, mes).toLocaleString('es-ES', { month: 'long' })} ${año}`;

    if (vistaActual === 'mes') {
        // Mes: grid con días y días vacíos al inicio según primer día
        contDias.innerHTML = '';
        const primerDia = new Date(año, mes, 1).getDay(); // 0 domingo .. 6 sab
        const diasEnMes = new Date(año, mes + 1, 0).getDate();
        // Añadir celdas vacías (ajusta si quieres lunes como inicio)
        for (let i = 0; i < primerDia; i++) {
            const c = document.createElement('div');
            c.classList.add('dia', 'vacio');
            contDias.appendChild(c);
        }
        // Días numerados
        for (let d = 1; d <= diasEnMes; d++) {
            const cell = document.createElement('div');
            cell.classList.add('dia', 'btn', 'btn-light', 'text-center', 'p-2');
            cell.textContent = d;
            const key = `${año}-${mes + 1}-${d}`; // clave visual (se usa internamente también)
            const dateObj = new Date(año, mes, d);
            const iso = claveISO(dateObj);
            if (eventos[iso] && eventos[iso].length) cell.classList.add('evento');
            const hoy = new Date();
            if (dateObj.toDateString() === hoy.toDateString()) cell.classList.add('hoy');
            cell.addEventListener('click', () => {
                diaSeleccionado = iso;
                mostrarEventos(iso, d);
            });
            contDias.appendChild(cell);
        }
    } else if (vistaActual === 'semana') {
        // Vista semanal: generar 7 días desde inicio de la semana (domingo)
        contSemana.innerHTML = '';
        const inicioSemana = new Date(fechaActual);
        inicioSemana.setDate(fechaActual.getDate() - fechaActual.getDay());
        let html = '<h3 class="mb-3">Vista Semanal</h3><div class="row">';
        for (let i = 0; i < 7; i++) {
            const dia = new Date(inicioSemana);
            dia.setDate(inicioSemana.getDate() + i);
            const iso = claveISO(dia);
            const claseEvento = (eventos[iso] && eventos[iso].length) ? 'evento' : '';
            const claseHoy = (dia.toDateString() === new Date().toDateString()) ? 'hoy' : '';
            html += `<div class="col dia btn btn-light text-center p-2 ${claseEvento} ${claseHoy}" data-clave="${iso}" data-dia="${dia.getDate()}">${dia.getDate()} ${dia.toLocaleString('es-ES', { weekday: 'short' })}</div>`;
        }
        html += '</div>';
        contSemana.innerHTML = html;
        // añadir listeners
        contSemana.querySelectorAll('.dia').forEach(d => {
            d.addEventListener('click', () => {
                const clave = d.getAttribute('data-clave');
                const dia = parseInt(d.getAttribute('data-dia'), 10);
                diaSeleccionado = clave;
                mostrarEventos(clave, dia);
            });
        });
    } else if (vistaActual === 'dia') {
        const titulo = `${fechaActual.getDate()} de ${new Date(fechaActual.getFullYear(), fechaActual.getMonth()).toLocaleString('es-ES', { month: 'long' })} ${fechaActual.getFullYear()}`;
        contDia.innerHTML = `<h3 class="mb-3">${titulo}</h3>`;
        const clave = claveISO(fechaActual);
        diaSeleccionado = clave;
        mostrarEventos(clave, fechaActual.getDate());
    }
}

// ---- Mostrar eventos en el panel / formulario ----
function mostrarEventos(clave, dia) {
    const form = document.getElementById('evento-form');
    const titulo = document.getElementById('evento-titulo');
    const lista = document.getElementById('evento-lista');
    const nombre = document.getElementById('evento-nombre');
    const fechaInput = document.getElementById('evento-fecha');
    const categoria = document.getElementById('evento-categoria');
    const desc = document.getElementById('evento-desc');
    const filtroCategoria = document.getElementById('filtro-categoria');

    if (!titulo || !lista || !nombre || !fechaInput || !categoria || !desc || !filtroCategoria || !form) return;

    // Título contextual
    titulo.textContent = `Eventos para el ${dia} de ${new Date(fechaActual.getFullYear(), fechaActual.getMonth()).toLocaleString('es-ES', { month: 'long' })}`;
    lista.innerHTML = '';
    nombre.value = '';
    fechaInput.value = '';
    categoria.value = categorias[0] || 'Trabajo';
    desc.value = '';

    if (!eventos[clave]) eventos[clave] = [];

    // Filtrado por categoría
    const eventosFiltrados = eventos[clave].filter(ev => filtroCategoria.value === 'todos' || ev.categoria === filtroCategoria.value);
    eventosFiltrados.sort((a, b) => {
        if (!a.fecha) return 1;
        if (!b.fecha) return -1;
        return new Date(a.fecha) - new Date(b.fecha);
    });

    eventosFiltrados.forEach((evento) => {
        const indexReal = eventos[clave].indexOf(evento); // índice real
        const item = document.createElement('div');
        const safeClass = evento.categoria.replace(/\s/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
        item.className = `evento-item card mb-2 animate__animated animate__fadeInUp ${safeClass}`;
        item.innerHTML = `
            <div class="card-body">
                <h5 class="card-title">${evento.nombre || 'Sin nombre'}</h5>
                <p class="card-text">${evento.desc || 'Sin descripción'}</p>
                <small class="text-muted">${evento.fecha ? new Date(evento.fecha).toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit' }) : 'Sin fecha'} - ${evento.categoria}</small>
            </div>
        `;
        // botones
        const btnEditar = document.createElement('button');
        btnEditar.textContent = 'Editar';
        btnEditar.className = 'btn btn-warning btn-sm me-2 editar';
        btnEditar.addEventListener('click', () => iniciarEdicion(clave, indexReal));

        const btnEliminar = document.createElement('button');
        btnEliminar.textContent = 'Eliminar';
        btnEliminar.className = 'btn btn-danger btn-sm';
        btnEliminar.addEventListener('click', () => {
            eventos[clave].splice(indexReal, 1);
            if (eventos[clave].length === 0) delete eventos[clave];
            guardarEventos();
            mostrarEventos(clave, dia);
            generarCalendario();
        });

        item.querySelector('.card-body').appendChild(btnEditar);
        item.querySelector('.card-body').appendChild(btnEliminar);
        lista.appendChild(item);
    });

    // Mostrar y animar form
    form.style.display = 'block';
    form.classList.add('animate__animated', 'animate__fadeIn');

    // Botón guardar: limpiar handlers previamente por reemplazo del nodo (evita duplicados)
    const btnGuardar = document.getElementById('guardar-evento');
    const nuevoBtnGuardar = btnGuardar.cloneNode(true);
    btnGuardar.parentNode.replaceChild(nuevoBtnGuardar, btnGuardar);
    nuevoBtnGuardar.addEventListener('click', () => {
        // validación
        const nombreVal = document.getElementById('evento-nombre').value.trim();
        if (!nombreVal) {
            alert('El nombre del evento es obligatorio.');
            return;
        }
        const ev = {
            nombre: document.getElementById('evento-nombre').value,
            fecha: document.getElementById('evento-fecha').value || null,
            categoria: document.getElementById('evento-categoria').value,
            desc: document.getElementById('evento-desc').value
        };

        if (editando.activo && editando.clave === clave) {
            // editar
            eventos[clave][editando.indice] = ev;
            editando = { activo: false, indice: null, clave: null };
        } else {
            eventos[clave].push(ev);
        }
        guardarEventos();
        // programar recordatorio si tiene fecha
        programarRecordatorio(clave, ev);
        mostrarEventos(clave, dia);
        generarCalendario();
    });
}

// ---- Iniciar edición (preparar form con datos) ----
function iniciarEdicion(clave, index) {
    const ev = eventos[clave][index];
    if (!ev) return;
    document.getElementById('evento-nombre').value = ev.nombre || '';
    // Si ev.fecha tiene ISO datetime, lo dejamos en input tipo datetime-local: hay que adaptar formato
    document.getElementById('evento-fecha').value = ev.fecha ? ev.fecha : '';
    document.getElementById('evento-categoria').value = ev.categoria || categorias[0];
    document.getElementById('evento-desc').value = ev.desc || '';
    editando = { activo: true, indice: index, clave: clave };
}

// ---- Programar recordatorio (limitaciones: funciona solo mientras la página esté abierta) ----
function programarRecordatorio(clave, evento) {
    if (!evento || !evento.fecha) return;
    if (!('Notification' in window)) return;
    // pedir permiso si no lo hay
    if (Notification.permission !== 'granted') {
        Notification.requestPermission().then(() => {
            if (Notification.permission !== 'granted') return;
        });
    }
    if (Notification.permission === 'granted') {
        const fechaEv = new Date(evento.fecha);
        const ahora = new Date();
        const diff = fechaEv - ahora;
        if (diff > 0 && diff < 2147483647) { // setTimeout max ~24.8 días para seguridad
            setTimeout(() => {
                new Notification(`Recordatorio: ${evento.nombre || 'Evento'}`, {
                    body: `${evento.desc || ''} — ${fechaEv.toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
                });
            }, diff);
        }
    }
}

// Solicitar permiso (opcionalmente al iniciar)
if ('Notification' in window && Notification.permission !== 'granted') {
    Notification.requestPermission();
}

// ---- Botones UI: prev / next / vistas / filtro / agregar categoría ----
const prevBot = document.getElementById('prev-mes');
const nextBot = document.getElementById('next-mes');
const vistaMesBtn = document.getElementById('vista-mes');
const vistaSemanaBtn = document.getElementById('vista-semana');
const vistaDiaBtn = document.getElementById('vista-dia');
const agregarCatBtn = document.getElementById('agregar-categoria');

if (prevBot) prevBot.addEventListener('click', () => {
    if (vistaActual === 'mes') fechaActual.setMonth(fechaActual.getMonth() - 1);
    else if (vistaActual === 'semana') fechaActual.setDate(fechaActual.getDate() - 7);
    else fechaActual.setDate(fechaActual.getDate() - 1);
    generarCalendario();
    // esconder form
    const fm = document.getElementById('evento-form');
    if (fm) { fm.style.display = 'none'; fm.classList.remove('animate__animated', 'animate__fadeIn'); }
});

if (nextBot) nextBot.addEventListener('click', () => {
    if (vistaActual === 'mes') fechaActual.setMonth(fechaActual.getMonth() + 1);
    else if (vistaActual === 'semana') fechaActual.setDate(fechaActual.getDate() + 7);
    else fechaActual.setDate(fechaActual.getDate() + 1);
    generarCalendario();
    const fm = document.getElementById('evento-form');
    if (fm) { fm.style.display = 'none'; fm.classList.remove('animate__animated', 'animate__fadeIn'); }
});

if (vistaMesBtn) vistaMesBtn.addEventListener('click', () => { vistaActual = 'mes'; generarCalendario(); const fm = document.getElementById('evento-form'); if (fm) { fm.style.display = 'none'; fm.classList.remove('animate__animated','animate__fadeIn'); }});
if (vistaSemanaBtn) vistaSemanaBtn.addEventListener('click', () => { vistaActual = 'semana'; generarCalendario(); const fm = document.getElementById('evento-form'); if (fm) { fm.style.display = 'none'; fm.classList.remove('animate__animated','animate__fadeIn'); }});
if (vistaDiaBtn) vistaDiaBtn.addEventListener('click', () => { vistaActual = 'dia'; generarCalendario(); });

// Filtro categoría
const filtroCategoria = document.getElementById('filtro-categoria');
if (filtroCategoria) filtroCategoria.addEventListener('change', () => {
    // recalculamos la vista actual (si hay panel abierto)
    const clave = diaSeleccionado || claveISO(fechaActual);
    mostrarEventos(clave, new Date(clave).getDate());
});

// Agregar categoría
if (agregarCatBtn) {
    agregarCatBtn.addEventListener('click', () => {
        const input = document.getElementById('nueva-categoria');
        if (!input) return;
        const nueva = input.value.trim();
        if (!nueva) return;
        if (!categorias.includes(nueva)) {
            categorias.push(nueva);
            // asignar color y guardar
            if (!colores[nueva]) colores[nueva] = generarColor();
            guardarCategorias();
            guardarColores();
            actualizarCategorias();
            actualizarEstilosCategorias();
        }
        input.value = '';
    });
}

// ---- Inicialización ----
actualizarCategorias();
actualizarEstilosCategorias();
generarCalendario();

// Programar recordatorios existentes (opcional: reprograma si la página se carga y quedan recordatorios futuros)
Object.keys(eventos).forEach(clave => {
    eventos[clave].forEach(ev => {
        // si ev.fecha existe y es futura, programarlo
        if (ev && ev.fecha) {
            const fechaEv = new Date(ev.fecha);
            if (fechaEv - new Date() > 0 && Notification.permission === 'granted') {
                programarRecordatorio(clave, ev);
            }
        }
    });
});

/* FIN script.js */
