// Datos iniciales
let productos = JSON.parse(localStorage.getItem("productos")) || [];
let faltantesManuales = JSON.parse(localStorage.getItem("faltantesManuales")) || [];
let actividades = JSON.parse(localStorage.getItem("actividades")) || {};
let fechaActual = new Date();

// DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".toggle-colapsar").forEach(btn => {
    btn.addEventListener("click", () => {
      const contenido = btn.nextElementSibling;
      contenido.style.display = contenido.style.display === "none" ? "block" : "none";
    });
  });

  renderTabla();
  renderFaltantesManuales();
  renderListaGeneral();
  renderCalendario();
});

// REGISTRO DE PRODUCTOS
document.getElementById("form-producto").onsubmit = (e) => {
  e.preventDefault();
  const producto = {
    nombre: document.getElementById("nombre").value.trim(),
    cantidad: parseInt(document.getElementById("cantidad").value),
    categoria: document.getElementById("categoria").value,
    ubicacion: document.getElementById("ubicacion").value,
    fecha: document.getElementById("fecha").value
  };
  productos.push(producto);
  localStorage.setItem("productos", JSON.stringify(productos));
  e.target.reset();
  renderTabla();
  renderListaGeneral();
};

function renderTabla() {
  const tabla = document.getElementById("tabla-productos");

  const buscar = document.getElementById("buscar").value.toLowerCase();
  const categoria = document.getElementById("filtro-categoria").value;
  const ubicacion = document.getElementById("filtro-ubicacion").value;
  const cantidadMin = parseInt(document.getElementById("filtro-cantidad").value) || 0;

  const filtrados = productos.filter(p => {
    return (
      p.nombre.toLowerCase().includes(buscar) &&
      (categoria === "" || p.categoria === categoria) &&
      (ubicacion === "" || p.ubicacion === ubicacion) &&
      p.cantidad >= cantidadMin
    );
  });

  tabla.innerHTML = "";
  filtrados.forEach((p, i) => {
    tabla.innerHTML += `
      <tr>
        <td>${p.nombre}</td>
        <td>${p.cantidad}</td>
        <td data-categoria="${p.categoria}">${p.categoria}</td>
        <td>${p.ubicacion}</td>
        <td>${p.fecha}</td>
        <td>
          <button onclick="editarProducto(${i})">✏️</button>
          <button onclick="eliminarProducto(${i})">🗑️</button>
        </td>
      </tr>`;
  });

  // Faltantes automáticos: cantidad === 0
  const faltantes = productos.filter(p => p.cantidad === 0);
  const divFaltantes = document.getElementById("faltantes");
  if (faltantes.length) {
    let html = "<h3>🔴 Productos Faltantes</h3><ul>";
    faltantes.forEach((p) => {
      html += `<li>${p.nombre} (0)
        <button onclick="marcarComprado('${p.nombre}')">Comprado</button>
      </li>`;
    });
    html += "</ul>";
    divFaltantes.innerHTML = html;
  } else {
    divFaltantes.innerHTML = "";
  }
}

function editarProducto(i) {
  const nuevo = prompt("Nueva cantidad para " + productos[i].nombre + ":", productos[i].cantidad);
  if (nuevo !== null && !isNaN(parseInt(nuevo))) {
    productos[i].cantidad = parseInt(nuevo);
    localStorage.setItem("productos", JSON.stringify(productos));
    renderTabla();
    renderListaGeneral();
  }
}

function eliminarProducto(i) {
  if (confirm("¿Eliminar este producto?")) {
    productos.splice(i, 1);
    localStorage.setItem("productos", JSON.stringify(productos));
    renderTabla();
    renderListaGeneral();
  }
}

function marcarComprado(nombre) {
  const i = productos.findIndex(p => p.nombre === nombre);
  if (i !== -1) {
    productos[i].cantidad = 2;
    localStorage.setItem("productos", JSON.stringify(productos));
    renderTabla();
    renderListaGeneral();
  }
}

document.getElementById("btn-exportar").onclick = () => {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(productos);
  XLSX.utils.book_append_sheet(wb, ws, "Inventario");
  XLSX.writeFile(wb, "inventario.xlsx");
};

// FALTANTES MANUALES
document.getElementById("form-faltante-manual").onsubmit = (e) => {
  e.preventDefault();
  const nombre = document.getElementById("nombre-faltante").value.trim();
  if (nombre) {
    faltantesManuales.push(nombre);
    localStorage.setItem("faltantesManuales", JSON.stringify(faltantesManuales));
    renderFaltantesManuales();
    renderListaGeneral();
    e.target.reset();
  }
};

function renderFaltantesManuales() {
  const lista = document.getElementById("lista-faltantes-manuales");
  lista.innerHTML = "";
  faltantesManuales.forEach((item, i) => {
    lista.innerHTML += `<li>${item} <button onclick="eliminarFaltanteManual(${i})">❌</button></li>`;
  });
}

function eliminarFaltanteManual(i) {
  faltantesManuales.splice(i, 1);
  localStorage.setItem("faltantesManuales", JSON.stringify(faltantesManuales));
  renderFaltantesManuales();
  renderListaGeneral();
}

// LISTA GENERAL
function renderListaGeneral() {
  const lista = document.getElementById("consolidado");
  const existentes = productos.map(p => `${p.nombre} (existente)`);
  const auto = productos.filter(p => p.cantidad === 0).map(p => `${p.nombre} (faltante automático)`);
  const manuales = faltantesManuales.map(p => `${p} (faltante manual)`);
  const total = [...new Set([...existentes, ...auto, ...manuales])];
  lista.innerHTML = "";
  total.forEach(item => {
    lista.innerHTML += `<li>${item}</li>`;
  });
}

document.getElementById("exportar-general").onclick = () => {
  const existentes = productos.map(p => ({ nombre: p.nombre, tipo: "Existente" }));
  const auto = productos.filter(p => p.cantidad === 0).map(p => ({ nombre: p.nombre, tipo: "Faltante automático" }));
  const manuales = faltantesManuales.map(nombre => ({ nombre, tipo: "Faltante manual" }));
  const datos = [...existentes, ...auto, ...manuales];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(datos);
  XLSX.utils.book_append_sheet(wb, ws, "Lista General");
  XLSX.writeFile(wb, "lista-general.xlsx");
};

// CALENDARIO
function renderCalendario() {
  const calendario = document.getElementById("calendario");
  const mesAnio = document.getElementById("mes-anio");
  const año = fechaActual.getFullYear();
  const mes = fechaActual.getMonth();
  const primerDia = new Date(año, mes, 1);
  const diaSemana = (primerDia.getDay() + 6) % 7;
  const diasMes = new Date(año, mes + 1, 0).getDate();

  mesAnio.textContent = primerDia.toLocaleDateString("es-ES", { month: 'long', year: 'numeric' });

  calendario.innerHTML = "";
  for (let i = 0; i < diaSemana; i++) {
    calendario.innerHTML += `<div></div>`;
  }

  for (let d = 1; d <= diasMes; d++) {
    const fechaStr = `${año}-${String(mes + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const eventos = actividades[fechaStr] || [];
    let contenido = `<div class="dia" onclick="abrirModal('${fechaStr}')">${d}`;
    if (eventos.length > 0) {
      contenido += `<small>📝 ${eventos[0]}</small>`;
      if (eventos.length > 1) {
        contenido += `<small>+${eventos.length - 1} más</small>`;
      }
    }
    contenido += `</div>`;
    calendario.innerHTML += contenido;
  }
}

document.getElementById("prev-mes").onclick = () => {
  fechaActual.setMonth(fechaActual.getMonth() - 1);
  renderCalendario();
};

document.getElementById("next-mes").onclick = () => {
  fechaActual.setMonth(fechaActual.getMonth() + 1);
  renderCalendario();
};

function abrirModal(fecha) {
  document.getElementById("modal").style.display = "flex";
  document.getElementById("fecha-modal").textContent = fecha;
  renderActividades(fecha);
}

function renderActividades(fecha) {
  const lista = document.getElementById("lista-actividades");
  lista.innerHTML = "";
  (actividades[fecha] || []).forEach((a, i) => {
    lista.innerHTML += `<li>${a} <button onclick="eliminarActividad('${fecha}', ${i})">❌</button></li>`;
  });
}

document.getElementById("agregar-actividad").onclick = () => {
  const fecha = document.getElementById("fecha-modal").textContent;
  const act = document.getElementById("nueva-actividad").value.trim();
  if (!act) return;
  if (!actividades[fecha]) actividades[fecha] = [];
  actividades[fecha].push(act);
  localStorage.setItem("actividades", JSON.stringify(actividades));
  document.getElementById("nueva-actividad").value = "";
  renderActividades(fecha);
  renderCalendario();
};

function eliminarActividad(fecha, i) {
  actividades[fecha].splice(i, 1);
  localStorage.setItem("actividades", JSON.stringify(actividades));
  renderActividades(fecha);
  renderCalendario();
}

document.getElementById("cerrar-modal").onclick = () => {
  document.getElementById("modal").style.display = "none";
};

// FILTROS EN TIEMPO REAL
document.getElementById("buscar").addEventListener("input", renderTabla);
document.getElementById("filtro-categoria").addEventListener("change", renderTabla);
document.getElementById("filtro-ubicacion").addEventListener("change", renderTabla);
document.getElementById("filtro-cantidad").addEventListener("input", renderTabla);
