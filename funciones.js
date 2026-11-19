/* Funcionalidad local de Luttan Donuts. No requiere librerías. */
(() => {
    'use strict';
    const ruta = location.pathname.split('/').filter(Boolean);
    const pagina = ruta.at(-2) || 'principal';
    const rol = ruta.at(-3) || 'principal';
    const clave = 'luttan_datos_v1';
    const leer = () => { try { return JSON.parse(localStorage.getItem(clave)) || {}; } catch { return {}; } };
    const guardar = (tipo, registro) => { const datos = leer(); (datos[tipo] ||= []).push({ ...registro, fechaRegistro: new Date().toISOString() }); localStorage.setItem(clave, JSON.stringify(datos)); };
    const dinero = n => '$' + Number(n || 0).toLocaleString('es-CO');
    const aviso = mensaje => window.alert(mensaje);
    const texto = nodo => (nodo?.textContent || '').trim().replace(/\s+/g, ' ');
    const campos = form => [...form.querySelectorAll('input:not([type=radio]):not([type=file]),textarea,select')].map(i => ({ nombre: texto(i.closest('label')) || i.name || i.placeholder || 'Dato', valor: i.value.trim() }));
    const escape = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    // El archivo original no incluye la imagen del logotipo.
    document.querySelectorAll('img[src*="imagenes/Luttan.jpg"]').forEach(img => { img.onerror = () => { img.onerror = null; img.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" rx="24" fill="#ffe7e8"/><text x="60" y="80" font-size="68" text-anchor="middle">🍩</text></svg>'); }; });
    // Filtros sin recargar la página.
    document.querySelectorAll('form.filters').forEach(form => {
        const contenedor = form.nextElementSibling;
        const elementos = contenedor?.matches('table') ? [...contenedor.querySelectorAll('tbody tr')] : [...(contenedor?.querySelectorAll('tbody tr,.product-card') || [])];
        const filtrar = e => { e?.preventDefault(); const buscar = textoInput(form, 'search').toLowerCase(); const selects = [...form.querySelectorAll('select')].map(x => x.value.toLowerCase()).filter(x => !x.startsWith('todas')); elementos.forEach(el => { const t = texto(el).toLowerCase(); el.hidden = !(t.includes(buscar) && selects.every(x => t.includes(x))); }); };
        form.addEventListener('submit', filtrar); form.querySelectorAll('input,select').forEach(i => i.addEventListener('input', filtrar));
    });
    function textoInput(form, tipo) { return form.querySelector(`input[type="${tipo}"]`)?.value.trim() || ''; }
    // Formularios: los datos quedan almacenados en este navegador.
    document.querySelectorAll('form:not(.filters):not(#form-contrasena)').forEach(form => {
        form.addEventListener('submit', e => {
            if (!form.reportValidity()) return;
            if (pagina === 'inicio-sesion') { sessionStorage.setItem('luttan_rol', rol); return; }
            e.preventDefault();
            if (pagina === 'detalle-producto') { agregar('Dona de Fresa', 4500, Number(form.querySelector('input[type=number]')?.value || 1)); location.href = form.action; return; }
            if (pagina === 'finalizar-compra') {
                const carrito = leer().carrito || [];
                if (!carrito.length) { aviso('Agrega productos al pedido antes de confirmar.'); return; }
                guardar('pedidos', { cliente: campos(form), productos: carrito, total: carrito.reduce((s, p) => s + p.precio * p.cantidad, 3500) });
                const d = leer(); d.carrito = []; localStorage.setItem(clave, JSON.stringify(d)); aviso('Pedido registrado correctamente en este navegador.'); location.href = form.action; return;
            }
            if (pagina === 'nosotros') { guardar('mensajes', { campos: campos(form) }); aviso('Mensaje guardado correctamente.'); form.reset(); return; }
            const tipo = ({ 'nuevo-producto': 'productos', 'nuevo-cliente': 'clientes', 'nuevo-empleado': 'empleados', 'registrar-gasto': 'gastos', 'nueva-venta': 'ventas', 'actualizar-inventario': 'inventario', 'cierre-caja': 'cierres', 'perfil': 'perfiles' })[pagina];
            if (tipo) { guardar(tipo, { campos: campos(form), rol }); aviso('Información guardada correctamente en este navegador.'); if (form.action) location.href = form.action; }
        });
    });
    function agregar(nombre, precio, cantidad = 1) { const d = leer(); const c = d.carrito || []; const p = c.find(x => x.nombre === nombre); if (p) p.cantidad += cantidad; else c.push({ nombre, precio, cantidad }); d.carrito = c; localStorage.setItem(clave, JSON.stringify(d)); }
    // Añadir productos al carrito sin pasar directamente a finalizar compra.
    document.querySelectorAll('a').forEach(a => {
        if (texto(a) === 'Agregar +') a.addEventListener('click', e => {
            e.preventDefault(); const tarjeta = a.closest('article'); const nombre = texto(tarjeta?.querySelector('h2,h3,strong')) || 'Dona de Fresa';
            const valor = texto(tarjeta).match(/\$\s*([\d.,]+)/); const precio = valor ? Number(valor[1].replace(/\D/g, '')) : 4500;
            agregar(nombre, precio); actualizarCarrito(); aviso(nombre + ' agregado al pedido.');
        });
        if (a.classList.contains('sidebar__logout')) a.addEventListener('click', () => sessionStorage.removeItem('luttan_rol'));
    });
    function actualizarCarrito() { const c = leer().carrito || []; document.querySelectorAll('.cart-count').forEach(x => x.textContent = c.reduce((s, p) => s + p.cantidad, 0)); }
    actualizarCarrito();
    // Resumen real del pedido, en lugar de cantidades fijas de demostración.
    if (pagina === 'finalizar-compra') {
        const c = leer().carrito || []; const lista = document.querySelector('.order-summary ul'); const resumen = document.querySelector('.order-summary dl');
        const subtotal = c.reduce((s, p) => s + p.precio * p.cantidad, 0); const envio = c.length ? 3500 : 0;
        if (lista) lista.innerHTML = c.length ? c.map(p => `<li><span><strong>${escape(p.nombre)}</strong><small>${p.cantidad} × ${dinero(p.precio)}</small></span><b>${dinero(p.precio * p.cantidad)}</b></li>`).join('') : '<li>Tu pedido está vacío.</li>';
        if (resumen) resumen.innerHTML = `<dt>Subtotal</dt><dd>${dinero(subtotal)}</dd><dt>Envío</dt><dd>${dinero(envio)}</dd><dt class="order-total">Total</dt><dd class="order-total">${dinero(subtotal + envio)}</dd>`;
        const boton = document.querySelector('.button--checkout'); if (boton) boton.textContent = 'Confirmar pedido · ' + dinero(subtotal + envio);
    }
    // Cambiar el estado de productos existentes.
    document.querySelectorAll('.product-card button').forEach(b => b.addEventListener('click', () => {
        const tarjeta = b.closest('.product-card'); const activo = texto(b) === 'Activar'; b.textContent = activo ? 'Desactivar' : 'Activar';
        const pill = tarjeta.querySelector('.pill'); if (pill) { pill.textContent = activo ? 'Activo' : 'Inactivo'; pill.classList.toggle('pill--green', activo); }
        const d = leer(); (d.estadosProductos ||= {})[texto(tarjeta.querySelector('h2'))] = activo; localStorage.setItem(clave, JSON.stringify(d));
    }));
    if (pagina === 'productos') document.querySelectorAll('.product-card').forEach(t => { const estado = leer().estadosProductos?.[texto(t.querySelector('h2'))]; if (estado === undefined) return; const b = t.querySelector('button'); if (b && (texto(b) === 'Activar') !== estado) b.click(); });
    // Exportar los datos locales a CSV.
    if (pagina === 'reportes') document.querySelectorAll('button').forEach(b => {
        if (!texto(b).includes('CSV')) return; b.type = 'button'; b.addEventListener('click', () => {
            const d = leer(); const filas = [['Tipo', 'Fecha', 'Información']]; for (const [tipo, registros] of Object.entries(d)) if (Array.isArray(registros)) registros.forEach(r => filas.push([tipo, r.fechaRegistro || '', JSON.stringify(r)]));
            const csv = '\ufeff' + filas.map(f => f.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(';')).join('\r\n'); const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = 'reporte-luttan.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
        });
    });
    // Mostrar registros añadidos, manteniendo las tablas originales.
    const tipoListado = ({ 'clientes': 'clientes', 'empleados': 'empleados', 'gastos': 'gastos', 'ventas': 'ventas', 'inventario': 'inventario' })[pagina];
    if (tipoListado) {
        const tbody = document.querySelector('table tbody'); const registros = (leer()[tipoListado] || []).filter(x => !x.rol || x.rol === rol || tipoListado === 'clientes');
        if (tbody) registros.forEach(r => { const tr = document.createElement('tr'); const columnas = tbody.querySelector('tr')?.children.length || 4; const valores = (r.campos || []).map(x => x.valor); for (let i = 0; i < columnas; i++) { const td = document.createElement('td'); td.textContent = valores[i] || (i === 0 ? 'Nuevo registro' : '—'); tr.appendChild(td); } tbody.prepend(tr); });
    }
    // Botones informativos que no deberían enviar formularios ni recargar la página.
    document.querySelectorAll('button').forEach(b => { if (!b.closest('form') && !b.closest('.product-card') && pagina === 'inicio') b.type = 'button'; });
    // Filtrar las donas del catálogo sin cambiar de pantalla.
    if (document.querySelector('.catalog-filters')) {
        const filtros = document.querySelectorAll('.catalog-filters a');
        const donas = document.querySelectorAll('.store-product[data-categoria]');
        filtros.forEach(filtro => filtro.addEventListener('click', evento => {
            evento.preventDefault();
            filtros.forEach(boton => boton.classList.remove('active'));
            filtro.classList.add('active');
            const categoria = filtro.dataset.filtro;
            donas.forEach(dona => { dona.hidden = categoria !== 'todas' && dona.dataset.categoria !== categoria; });
        }));
    }
    // Demostración local: valida la confirmación, no cambia contraseñas del servidor.
    const formContrasena = document.querySelector('#form-contrasena');
    if (formContrasena) formContrasena.addEventListener('submit', evento => {
        evento.preventDefault();
        const nueva = formContrasena.elements.nueva.value;
        const confirmar = formContrasena.elements.confirmar.value;
        const mensaje = document.querySelector('#mensaje-contrasena');
        if (nueva !== confirmar) { mensaje.textContent = 'Las contraseñas no coinciden.'; return; }
        mensaje.textContent = 'Contraseña confirmada. Esta pantalla es una demostración local.';
        formContrasena.reset();
    });

})();
