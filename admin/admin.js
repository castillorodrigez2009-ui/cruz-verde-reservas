const SUPABASE_URL =
  "https://hnmyzfcjgdxjilzzpgue.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_HG_VFr6DFRtjWcj_2fBnMA_oyV9tsGo";


// ==============================
// ELEMENTOS
// ==============================

const login =
  document.getElementById("login");

const panel =
  document.getElementById("panel");

const loginForm =
  document.getElementById("loginForm");

const emailInput =
  document.getElementById("email");

const passwordInput =
  document.getElementById("password");

const btnLogin =
  document.getElementById("btnLogin");

const loginError =
  document.getElementById("loginError");

const btnCerrarSesion =
  document.getElementById("btnCerrarSesion");

const fechaAdmin =
  document.getElementById("fechaAdmin");

const reservasContainer =
  document.getElementById("reservasContainer");

const totalReservas =
  document.getElementById("totalReservas");

const totalDisponibles =
  document.getElementById("totalDisponibles");


// ==============================
// HEADERS
// ==============================

function headersSesion(accessToken) {

  return {
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${accessToken}`,
    "Content-Type": "application/json"
  };

}


// ==============================
// INICIAR SESIÓN
// ==============================

loginForm.addEventListener(
  "submit",
  async function(event) {

    event.preventDefault();

    ocultarError();

    btnLogin.disabled = true;
    btnLogin.textContent =
      "Ingresando...";

    const email =
      emailInput.value.trim();

    const password =
      passwordInput.value;

    try {

      const respuesta =
        await fetch(
          `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
          {
            method: "POST",

            headers: {
              "apikey": SUPABASE_KEY,
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              email,
              password
            })
          }
        );

      const datos =
        await respuesta.json();

      if (!respuesta.ok) {

        throw new Error(
          datos.message ||
          "Correo o contraseña incorrectos."
        );

      }

      const accessToken =
        datos.access_token;

      sessionStorage.setItem(
        "admin_access_token",
        accessToken
      );

      const esAdmin =
        await comprobarAdministrador(
          accessToken
        );

      if (!esAdmin) {

        sessionStorage.removeItem(
          "admin_access_token"
        );

        throw new Error(
          "Esta cuenta no tiene permisos de administrador."
        );

      }

      login.classList.add("oculto");

      panel.classList.remove("oculto");

      await cargarFechas(
        accessToken
      );

    } catch (error) {

      mostrarError(
        error.message
      );

      btnLogin.disabled = false;

      btnLogin.textContent =
        "Ingresar";

    }

  }
);


// ==============================
// COMPROBAR ADMIN
// ==============================

async function comprobarAdministrador(
  accessToken
) {

  const respuesta =
    await fetch(
      `${SUPABASE_URL}/rest/v1/admins?select=id`,
      {
        headers:
          headersSesion(accessToken)
      }
    );

  if (!respuesta.ok) {

    return false;

  }

  const admins =
    await respuesta.json();

  return admins.length > 0;

}


// ==============================
// CARGAR FECHAS
// ==============================

async function cargarFechas(
  accessToken
) {

  try {

    const respuesta =
      await fetch(
        `${SUPABASE_URL}/rest/v1/horarios?select=fecha&activo=eq.true&order=fecha.asc`,
        {
          headers:
            headersSesion(
              accessToken
            )
        }
      );

    if (!respuesta.ok) {

      throw new Error(
        "No se pudieron cargar las fechas."
      );

    }

    const datos =
      await respuesta.json();

    const fechas =
      [
        ...new Set(
          datos.map(
            item => item.fecha
          )
        )
      ];

    fechaAdmin.innerHTML =
      `<option value="">
        Selecciona una fecha
      </option>`;

    fechas.forEach(
      fecha => {

        const option =
          document.createElement(
            "option"
          );

        option.value =
          fecha;

        option.textContent =
          formatearFecha(
            fecha
          );

        fechaAdmin.appendChild(
          option
        );

      }
    );

  } catch (error) {

    mostrarError(
      error.message
    );

  }

}


// ==============================
// CAMBIO DE FECHA
// ==============================

fechaAdmin.addEventListener(
  "change",
  async function() {

    const fecha =
      fechaAdmin.value;

    if (!fecha) {

      reservasContainer.innerHTML =
        `<p>
          Selecciona una fecha.
        </p>`;

      totalReservas.textContent =
        "0";

      totalDisponibles.textContent =
        "0";

      return;

    }

    const accessToken =
      sessionStorage.getItem(
        "admin_access_token"
      );

    await cargarReservas(
      fecha,
      accessToken
    );

  }
);


// ==============================
// CARGAR RESERVAS
// ==============================

async function cargarReservas(
  fecha,
  accessToken
) {

  reservasContainer.innerHTML =
    `<p>
      Cargando reservas...
    </p>`;

  try {

    const respuestaHorarios =
      await fetch(
        `${SUPABASE_URL}/rest/v1/horarios?select=hora_inicio,hora_fin&fecha=eq.${fecha}&activo=eq.true&order=hora_inicio.asc`,
        {
          headers:
            headersSesion(
              accessToken
            )
        }
      );

    if (!respuestaHorarios.ok) {

      throw new Error(
        "No se pudieron cargar los horarios."
      );

    }

    const horarios =
      await respuestaHorarios.json();


    const respuestaReservas =
      await fetch(
        `${SUPABASE_URL}/rest/v1/reservas?select=id,nombre,correo,telefono,fecha,hora&fecha=eq.${fecha}&order=hora.asc`,
        {
          headers:
            headersSesion(
              accessToken
            )
        }
      );

    if (!respuestaReservas.ok) {

      throw new Error(
        "No se pudieron cargar las reservas."
      );

    }

    const reservas =
      await respuestaReservas.json();


    reservasContainer.innerHTML =
      "";

    totalReservas.textContent =
      reservas.length;

    totalDisponibles.textContent =
      horarios.length -
      reservas.length;


    horarios.forEach(
      horario => {

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


        const reserva =
          reservas.find(
            item =>
              item.hora.substring(
                0,
                5
              ) === horaInicio
          );


        // ==============================
        // HORARIO OCUPADO
        // ==============================

        if (reserva) {

          const card =
            document.createElement(
              "div"
            );

          card.className =
            "reserva-card ocupado";


          card.innerHTML = `
            <h3>
              🔴 ${horaInicio} - ${horaFin}
            </h3>

            <p>
              <strong>Nombre:</strong>
              ${escapeHTML(reserva.nombre)}
            </p>

            <p>
              <strong>Correo:</strong>
              ${escapeHTML(reserva.correo)}
            </p>

            <p>
              <strong>Teléfono:</strong>
              ${escapeHTML(reserva.telefono)}
            </p>

            <button
              class="btn-cancelar"
              data-id="${reserva.id}"
            >
              ❌ Cancelar reserva
            </button>
          `;


          const botonCancelar =
            card.querySelector(
              ".btn-cancelar"
            );


          botonCancelar.addEventListener(
            "click",
            async function() {

              const confirmar =
                confirm(
                  `¿Seguro que quieres cancelar la reserva de ${reserva.nombre} a las ${horaInicio}?`
                );

              if (!confirmar) {

                return;

              }


              await cancelarReserva(
                reserva.id,
                fecha,
                botonCancelar
              );

            }
          );


          reservasContainer.appendChild(
            card
          );


        }

        // ==============================
        // HORARIO DISPONIBLE
        // ==============================

        else {

          const card =
            document.createElement(
              "div"
            );

          card.className =
            "disponible";


          card.innerHTML = `
            <strong>
              🟢 ${horaInicio} - ${horaFin}
            </strong>

            <span>
              Disponible
            </span>
          `;


          reservasContainer.appendChild(
            card
          );

        }

      }
    );


  } catch (error) {

    reservasContainer.innerHTML =
      `<p class="error">
        ${escapeHTML(
          error.message
        )}
      </p>`;

  }

}


// ==============================
// CANCELAR RESERVA
// ==============================

async function cancelarReserva(
  id,
  fecha,
  boton
) {

  const accessToken =
    sessionStorage.getItem(
      "admin_access_token"
    );


  boton.disabled = true;

  boton.textContent =
    "Cancelando...";


  try {

    const respuesta =
      await fetch(
        `${SUPABASE_URL}/rest/v1/reservas?id=eq.${id}`,
        {
          method: "DELETE",

          headers:
            headersSesion(
              accessToken
            )
        }
      );


    if (!respuesta.ok) {

      const resultado =
        await respuesta.text();

      console.error(
        resultado
      );

      throw new Error(
        "No se pudo cancelar la reserva."
      );

    }


    // Volver a cargar la fecha
    await cargarReservas(
      fecha,
      accessToken
    );


  } catch (error) {

    alert(
      error.message
    );

    boton.disabled = false;

    boton.textContent =
      "❌ Cancelar reserva";

  }

}


// ==============================
// CERRAR SESIÓN
// ==============================

btnCerrarSesion.addEventListener(
  "click",
  function() {

    sessionStorage.removeItem(
      "admin_access_token"
    );

    panel.classList.add(
      "oculto"
    );

    login.classList.remove(
      "oculto"
    );

    loginForm.reset();

    reservasContainer.innerHTML =
      `<p>
        Selecciona una fecha.
      </p>`;

  }
);


// ==============================
// FORMATEAR FECHA
// ==============================

function formatearFecha(
  fecha
) {

  const partes =
    fecha.split("-");

  const fechaLocal =
    new Date(
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


// ==============================
// MOSTRAR ERROR
// ==============================

function mostrarError(
  mensaje
) {

  loginError.textContent =
    mensaje;

  loginError.classList.remove(
    "oculto"
  );

}


// ==============================
// OCULTAR ERROR
// ==============================

function ocultarError() {

  loginError.classList.add(
    "oculto"
  );

}


// ==============================
// SEGURIDAD HTML
// ==============================

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
