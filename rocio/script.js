const SUPABASE_URL =
  "https://hnmyzfcjgdxjilzzpgue.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_HG_VFr6DFRtjWcj_2fBnMA_oyV9tsGo";

// ======================================================
// AGENDA DE ROCÍO
// ======================================================

const AGENDA = "rocio";

// ======================================================
// HEADERS
// ======================================================

const headers = {
  apikey: SUPABASE_KEY,
  "Content-Type": "application/json"
};

// ======================================================
// ELEMENTOS
// ======================================================

const fechasContainer =
  document.getElementById("fechas");

const horariosContainer =
  document.getElementById("horarios");

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

// ======================================================
// VARIABLES
// ======================================================

let fechaSeleccionada = null;
let horaSeleccionada = null;

// ======================================================
// CARGAR FECHAS EXCLUSIVAMENTE DE ROCÍO
// ======================================================

async function cargarFechas() {

  try {

    const respuesta = await fetch(
      `${SUPABASE_URL}/rest/v1/horarios?select=fecha&agenda=eq.${AGENDA}&activo=eq.true&order=fecha.asc`,
      {
        headers
      }
    );

    if (!respuesta.ok) {
      throw new Error(
        "No se pudieron cargar las fechas."
      );
    }

    const datos =
      await respuesta.json();

    const fechasUnicas = [
      ...new Set(
        datos.map(item => item.fecha)
      )
    ];

    fechasContainer.innerHTML = "";

    if (fechasUnicas.length === 0) {

      fechasContainer.innerHTML =
        `<p class="message">
          No hay fechas disponibles.
        </p>`;

      return;
    }

    fechasUnicas.forEach(
      fecha => {

        const boton =
          document.createElement("button");

        boton.type = "button";

        boton.className =
          "fecha-btn";

        boton.textContent =
          formatearFecha(fecha);

        boton.addEventListener(
          "click",
          () => {

            document
              .querySelectorAll(".fecha-btn")
              .forEach(btn => {
                btn.classList.remove(
                  "selected"
                );
              });

            boton.classList.add(
              "selected"
            );

            fechaSeleccionada =
              fecha;

            fechaSeleccionadaInput.value =
              fecha;

            horaSeleccionada = null;

            horaSeleccionadaInput.value =
              "";

            btnReservar.disabled =
              true;

            resumenTexto.textContent =
              `${formatearFecha(fecha)} — selecciona un horario`;

            ocultarError();

            cargarHorarios(fecha);

          }
        );

        fechasContainer.appendChild(
          boton
        );

      }
    );

  } catch (error) {

    mostrarError(
      error.message
    );

  }

}

// ======================================================
// CARGAR HORARIOS EXCLUSIVAMENTE DE ROCÍO
// ======================================================

async function cargarHorarios(
  fecha
) {

  horariosContainer.innerHTML =
    `<p class="loading">
      Cargando horarios...
    </p>`;

  try {

    const respuesta =
      await fetch(
        `${SUPABASE_URL}/rest/v1/horarios?select=hora_inicio,hora_fin&agenda=eq.${AGENDA}&fecha=eq.${fecha}&activo=eq.true&order=hora_inicio.asc`,
        {
          headers
        }
      );

    if (!respuesta.ok) {

      throw new Error(
        "No se pudieron cargar los horarios."
      );

    }

    const horarios =
      await respuesta.json();

    horariosContainer.innerHTML =
      "";

    if (horarios.length === 0) {

      horariosContainer.innerHTML =
        `<p class="message">
          No hay horarios disponibles.
        </p>`;

      return;
    }

    const reservas =
      await cargarReservas(fecha);

    horarios.forEach(
      horario => {

        const boton =
          document.createElement("button");

        boton.type = "button";

        boton.className =
          "hora-btn";

        const horaInicio =
          horario.hora_inicio.substring(
            0,
            5
          );

        const horaFin =
          horario.hora_fin.substring(
            0,
            5
          );

        boton.textContent =
          `${horaInicio} - ${horaFin}`;

        const ocupado =
          reservas.some(
            reserva =>
              reserva.hora.substring(
                0,
                5
              ) === horaInicio
          );

        if (ocupado) {

          boton.classList.add(
            "ocupado"
          );

          boton.disabled =
            true;

          boton.textContent +=
            " — Ocupado";

        } else {

          boton.addEventListener(
            "click",
            () => {

              document
                .querySelectorAll(
                  ".hora-btn"
                )
                .forEach(btn => {
                  btn.classList.remove(
                    "selected"
                  );
                });

              boton.classList.add(
                "selected"
              );

              horaSeleccionada =
                horario.hora_inicio;

              horaSeleccionadaInput.value =
                horario.hora_inicio;

              resumenTexto.textContent =
                `${formatearFecha(fecha)} — ${horaInicio} a ${horaFin}`;

              btnReservar.disabled =
                false;

            }
          );

        }

        horariosContainer.appendChild(
          boton
        );

      }
    );

  } catch (error) {

    mostrarError(
      error.message
    );

  }

}

// ======================================================
// CARGAR RESERVAS DE ROCÍO
// ======================================================

async function cargarReservas(
  fecha
) {

  const respuesta =
    await fetch(
      `${SUPABASE_URL}/rest/v1/reservas?select=hora&agenda=eq.${AGENDA}&fecha=eq.${fecha}`,
      {
        headers
      }
    );

  if (!respuesta.ok) {

    throw new Error(
      "No se pudieron consultar las reservas."
    );

  }

  return await respuesta.json();

}

// ======================================================
// CREAR RESERVA
// ======================================================

reservaForm.addEventListener(
  "submit",
  async function(event) {

    event.preventDefault();

    if (
      !fechaSeleccionada ||
      !horaSeleccionada
    ) {

      mostrarError(
        "Selecciona una fecha y un horario."
      );

      return;
    }

    btnReservar.disabled =
      true;

    btnReservar.textContent =
      "Guardando reserva...";

    ocultarError();

    const nombre =
      document
        .getElementById("nombre")
        .value
        .trim();

    const correo =
      document
        .getElementById("correo")
        .value
        .trim();

    const telefono =
      document
        .getElementById("telefono")
        .value
        .trim();

    try {

      const respuesta =
        await fetch(
          `${SUPABASE_URL}/rest/v1/reservas`,
          {
            method: "POST",

            headers: {
              ...headers,
              Prefer:
                "return=minimal"
            },

            body: JSON.stringify({
              nombre,
              correo,
              telefono,
              fecha:
                fechaSeleccionada,
              hora:
                horaSeleccionada,
              agenda:
                AGENDA
            })
          }
        );

      if (!respuesta.ok) {

        let resultado = {};

        try {
          resultado =
            await respuesta.json();
        } catch {
          resultado = {};
        }

        const textoError =
          JSON.stringify(resultado);

        if (
          respuesta.status === 409 ||
          textoError.includes(
            "reservas_fecha_hora_unique"
          )
        ) {

          throw new Error(
            "Ese horario acaba de ser reservado por otra persona. Selecciona otro horario."
          );
        }

        if (
          respuesta.status === 401 ||
          respuesta.status === 403 ||
          textoError.includes(
            "row-level security"
          )
        ) {

          throw new Error(
            "Supabase está bloqueando la creación de la reserva. Revisa los permisos de la tabla."
          );
        }

        throw new Error(
          "No fue posible guardar la reserva."
        );
      }

      // ================================================
      // RESERVA EXITOSA
      // ================================================

      reservaForm.classList.add(
        "oculto"
      );

      exito.classList.remove(
        "oculto"
      );

      detalleReserva.innerHTML = `
        <p>
          <strong>Fecha:</strong>
          ${formatearFecha(
            fechaSeleccionada
          )}
        </p>

        <p>
          <strong>Horario:</strong>
          ${horaSeleccionada.substring(
            0,
            5
          )}
        </p>

        <p>
          <strong>Nombre:</strong>
          ${escapeHTML(nombre)}
        </p>

        <p>
          <strong>Correo:</strong>
          ${escapeHTML(correo)}
        </p>
      `;

    } catch (error) {

      mostrarError(
        error.message
      );

      btnReservar.disabled =
        false;

      btnReservar.textContent =
        "Confirmar reserva";

    }

  }
);

// ======================================================
// FORMATEAR FECHA
// ======================================================

function formatearFecha(
  fecha
) {

  const partes =
    fecha.split("-");

  const fechaLocal =
    new Date(
      Number(partes[0]),
      Number(partes[1]) - 1,
      Number(partes[2])
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

// ======================================================
// MOSTRAR ERROR
// ======================================================

function mostrarError(
  mensaje
) {

  errorBox.textContent =
    mensaje;

  errorBox.classList.remove(
    "oculto"
  );

}

// ======================================================
// OCULTAR ERROR
// ======================================================

function ocultarError() {

  errorBox.classList.add(
    "oculto"
  );

}

// ======================================================
// SEGURIDAD HTML
// ======================================================

function escapeHTML(
  texto
) {

  const div =
    document.createElement(
      "div"
    );

  div.textContent =
    texto ?? "";

  return div.innerHTML;

}

// ======================================================
// INICIAR PÁGINA
// ======================================================

cargarFechas();
