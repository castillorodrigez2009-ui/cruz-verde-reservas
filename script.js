const SUPABASE_URL = "https://hnmyzfcjgdxjilzzpgue.supabase.co";
const SUPABASE_KEY = "sb_publishable_HG_VFr6DFRtjWcj_2fBnMA_oyV9tsGo";

const headers = {
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json"
};

const fechasContainer = document.getElementById("fechas");
const horariosContainer = document.getElementById("horarios");

const fechaSeleccionadaInput =
  document.getElementById("fechaSeleccionada");

const horaSeleccionadaInput =
  document.getElementById("horaSeleccionada");

const resumenTexto =
  document.getElementById("resumenTexto");

const reservaForm =
  document.getElementById("reservaForm");

const btnReservar =
  document.getElementById("btnReservar");

const exito =
  document.getElementById("exito");

const errorBox =
  document.getElementById("error");

const detalleReserva =
  document.getElementById("detalleReserva");

let fechaSeleccionada = null;
let horaSeleccionada = null;
let horariosDisponibles = [];


/* ==============================
   CARGAR FECHAS
================================ */

async function cargarFechas() {

  try {

    const respuesta = await fetch(
      `${SUPABASE_URL}/rest/v1/horarios?select=fecha&activo=eq.true&order=fecha.asc`,
      {
        headers
      }
    );

    if (!respuesta.ok) {
      throw new Error("No se pudieron cargar las fechas.");
    }

    const datos = await respuesta.json();

    const fechasUnicas = [
      ...new Set(datos.map(item => item.fecha))
    ];

    fechasContainer.innerHTML = "";

    fechasUnicas.forEach(fecha => {

      const boton = document.createElement("button");

      boton.type = "button";
      boton.className = "fecha-btn";

      boton.textContent = formatearFecha(fecha);

      boton.addEventListener("click", () => {

        document
          .querySelectorAll(".fecha-btn")
          .forEach(btn => btn.classList.remove("selected"));

        boton.classList.add("selected");

        fechaSeleccionada = fecha;

        fechaSeleccionadaInput.value = fecha;

        horaSeleccionada = null;
        horaSeleccionadaInput.value = "";

        btnReservar.disabled = true;

        resumenTexto.textContent =
          `${formatearFecha(fecha)} — selecciona un horario`;

        cargarHorarios(fecha);

      });

      fechasContainer.appendChild(boton);

    });

  } catch (error) {

    mostrarError(error.message);

  }

}


/* ==============================
   CARGAR HORARIOS
================================ */

async function cargarHorarios(fecha) {

  horariosContainer.innerHTML =
    `<p class="loading">Cargando horarios...</p>`;

  try {

    const respuesta = await fetch(
      `${SUPABASE_URL}/rest/v1/horarios?select=hora_inicio,hora_fin&fecha=eq.${fecha}&activo=eq.true&order=hora_inicio.asc`,
      {
        headers
      }
    );

    if (!respuesta.ok) {
      throw new Error("No se pudieron cargar los horarios.");
    }

    horariosDisponibles = await respuesta.json();

    horariosContainer.innerHTML = "";

    if (horariosDisponibles.length === 0) {

      horariosContainer.innerHTML =
        `<p class="message">No hay horarios disponibles.</p>`;

      return;
    }

    const reservas = await cargarReservas(fecha);

    horariosDisponibles.forEach(horario => {

      const boton = document.createElement("button");

      boton.type = "button";
      boton.className = "hora-btn";

      const horaInicio = horario.hora_inicio.substring(0, 5);
      const horaFin = horario.hora_fin.substring(0, 5);

      boton.textContent =
        `${horaInicio} - ${horaFin}`;

      const ocupado = reservas.some(
        reserva => reserva.hora === horario.hora_inicio
      );

      if (ocupado) {

        boton.classList.add("ocupado");
        boton.disabled = true;
        boton.textContent += " — Ocupado";

      } else {

        boton.addEventListener("click", () => {

          document
            .querySelectorAll(".hora-btn")
            .forEach(btn => btn.classList.remove("selected"));

          boton.classList.add("selected");

          horaSeleccionada = horario.hora_inicio;

          horaSeleccionadaInput.value =
            horario.hora_inicio;

          resumenTexto.textContent =
            `${formatearFecha(fecha)} — ${horaInicio} a ${horaFin}`;

          btnReservar.disabled = false;

        });

      }

      horariosContainer.appendChild(boton);

    });

  } catch (error) {

    mostrarError(error.message);

  }

}


/* ==============================
   CARGAR RESERVAS
================================ */

async function cargarReservas(fecha) {

  const respuesta = await fetch(
    `${SUPABASE_URL}/rest/v1/reservas?select=hora&fecha=eq.${fecha}`,
    {
      headers
    }
  );

  if (!respuesta.ok) {
    throw new Error("No se pudieron consultar las reservas.");
  }

  return await respuesta.json();

}


/* ==============================
   CREAR RESERVA
================================ */

reservaForm.addEventListener("submit", async function(event) {

  event.preventDefault();

  if (!fechaSeleccionada || !horaSeleccionada) {

    mostrarError(
      "Selecciona una fecha y un horario."
    );

    return;

  }

  btnReservar.disabled = true;
  btnReservar.textContent = "Guardando reserva...";

  ocultarError();

  const nombre =
    document.getElementById("nombre").value.trim();

  const correo =
    document.getElementById("correo").value.trim();

  const telefono =
    document.getElementById("telefono").value.trim();


  try {

    const respuesta = await fetch(
      `${SUPABASE_URL}/rest/v1/reservas`,
      {
        method: "POST",

        headers: {
          ...headers,
          "Prefer": "return=representation"
        },

        body: JSON.stringify({
          nombre,
          correo,
          telefono,
          fecha: fechaSeleccionada,
          hora: horaSeleccionada
        })

      }
    );


    if (!respuesta.ok) {

      const resultado = await respuesta.json();

      if (
        respuesta.status === 409 ||
        JSON.stringify(resultado).includes("reserva_unica")
      ) {

        throw new Error(
          "Ese horario acaba de ser reservado por otra persona. Selecciona otro horario."
        );

      }

      throw new Error(
        "No fue posible guardar la reserva."
      );

    }


    const reservaCreada =
      await respuesta.json();


    reservaForm.classList.add("oculto");

    exito.classList.remove("oculto");

    detalleReserva.innerHTML = `
      <p><strong>Fecha:</strong> ${formatearFecha(fechaSeleccionada)}</p>
      <p><strong>Horario:</strong> ${horaSeleccionada.substring(0, 5)}</p>
      <p><strong>Nombre:</strong> ${nombre}</p>
      <p><strong>Correo:</strong> ${correo}</p>
    `;


  } catch (error) {

    mostrarError(error.message);

    btnReservar.disabled = false;
    btnReservar.textContent = "Confirmar reserva";

  }

});


/* ==============================
   FORMATEAR FECHA
================================ */

function formatearFecha(fecha) {

  const partes = fecha.split("-");

  const fechaLocal = new Date(
    partes[0],
    partes[1] - 1,
    partes[2]
  );

  return fechaLocal.toLocaleDateString(
    "es-CO",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }
  );

}


/* ==============================
   MENSAJES DE ERROR
================================ */

function mostrarError(mensaje) {

  errorBox.textContent = mensaje;

  errorBox.classList.remove("oculto");

}


function ocultarError() {

  errorBox.classList.add("oculto");

}


/* ==============================
   INICIAR
================================ */

cargarFechas();
