document.addEventListener("DOMContentLoaded", () => {

    // ALMACENAMIENTO
    let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
    let turnos = JSON.parse(localStorage.getItem("turnos")) || [];
    let usuarioActivo = JSON.parse(localStorage.getItem("usuarioActivo")) || null;
    let turnoEditando = null;
    let filtroActual = "";

    // ELEMENTOS
    const auth = document.getElementById("auth");
    const app = document.getElementById("app");
    const bienvenida = document.getElementById("bienvenida");

    const nombreInput = document.getElementById("nombre");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");

    const selectServicio = document.getElementById("servicio");
    const fechaInput = document.getElementById("fecha");
    const horaInput = document.getElementById("hora");

    const listaTurnos = document.getElementById("listaTurnos");
    const buscarInput = document.getElementById("buscar");
    const stats = document.getElementById("stats");
    const masSolicitado = document.getElementById("masSolicitado");

    // UTILIDADES
    const alerta = (texto, icon = "success") => {
        Swal.fire({ icon, title: texto, timer: 1800, showConfirmButton: false });
    };

    const guardarUsuarios = () => {
        localStorage.setItem("usuarios", JSON.stringify(usuarios));
    }

    const guardarTurnos = () => {
        localStorage.setItem("turnos", JSON.stringify(turnos));
    }

    const guardarSesion = () => {
        localStorage.setItem("usuarioActivo", JSON.stringify(usuarioActivo));
    }

    // VALIDATIÓN FORMULARIO DE REGISTRO
    const emailValido = email => {
        const formatoEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return formatoEmail.test(email);
    };

    const passwordValida = password => {
        const formatoPassword = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
        return formatoPassword.test(password);
    };

    const nombreValido = nombre => {
        const formatoNombre = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]{3,}$/;
        return formatoNombre.test(nombre);
    };


    // AUTENTICACIÓN
    document.getElementById("btnRegister").addEventListener("click", () => {
        const nombre = nombreInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!nombre || !email || !password)
            return alerta("Completá todos los datos", "error");

        if (!nombreValido(nombre))
            return alerta("El nombre debe tener al menos 3 letras y solo caracteres válidos", "error");

        if (!emailValido(email))
            return alerta("Ingresá un email válido", "error");

        if (!passwordValida(password))
            return alerta(
                "La contraseña debe tener al menos 6 caracteres, una letra y un número",
                "error"
            );

        if (usuarios.some(usuario => usuario.email === email))
            return alerta("Email ya registrado", "error");

        usuarios.push({
            id: Date.now(),
            nombre: nombre.toLowerCase(),
            email: email.toLowerCase(),
            password
        });


        guardarUsuarios();
        nombreInput.value = emailInput.value = passwordInput.value = "";
        alerta("Usuario registrado correctamente");
    });


    document.getElementById("btnLogin").addEventListener("click", () => {

        const nombre = nombreInput.value.trim().toLowerCase();
        const email = emailInput.value.trim().toLowerCase();
        const password = passwordInput.value.trim();

        if (!nombre || !email || !password) {
            return alerta("Completá todos los datos", "error");
        }

        const user = usuarios.find(u =>
            u.nombre.toLowerCase() === nombre &&
            u.email.toLowerCase() === email &&
            u.password === password
        );

        if (!user) {
            return alerta("Credenciales incorrectas", "error");
        }

        usuarioActivo = user;
        guardarSesion();

        Swal.fire({
            icon: "success",
            title: "Sesión iniciada",
            text: `Bienvenido/a ${user.nombre} a su sistema de turnos.`,
            timer: 2000,
            showConfirmButton: false
        }).then(iniciarApp);
    });



    document.getElementById("btnLogout").addEventListener("click", () => {
        Swal.fire({
            title: "¿Cerrar sesión?",
            text: "Se cerrará tu sesión actual",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, cerrar",
            cancelButtonText: "Cancelar",
            reverseButtons: true
        }).then(result => {
            if (result.isConfirmed) {
                usuarioActivo = null;
                localStorage.removeItem("usuarioActivo");
                app.classList.add("d-none");
                auth.classList.remove("d-none");

                Swal.fire({
                    icon: "success",
                    title: "Sesión cerrada",
                    timer: 1200,
                    showConfirmButton: false
                });
            }
        });
    });


    // APLICACIÓN PRINCIPAL
    const iniciarApp = () => {
        auth.classList.add("d-none");
        app.classList.remove("d-none");
        bienvenida.textContent = `Hola, ${usuarioActivo.nombre}`;
        cargarServicios();
        render();
    };

    if (usuarioActivo) iniciarApp();

    // CARGA DE SERVICIOS (FETCH)
    const btnAgregar = document.getElementById("btnAgregar");

    const cargarServicios = async () => {
        try {
            const response = await fetch("./data/servicios.json");

            if (!response.ok) {
                throw new Error("No se pudieron cargar los servicios");
            }

            const servicios = await response.json();

            selectServicio.innerHTML = `<option value="">Seleccione servicio</option>`;
            servicios.forEach(servicio => {
                selectServicio.innerHTML += `<option>${servicio.nombre}</option>`;
            });

            btnAgregar.disabled = false;

        } catch (error) {
            alerta("Error al cargar los servicios", "error");
            btnAgregar.disabled = true;
            console.error(error);
        }
    };

    // TURNOS
    btnAgregar.addEventListener("click", () => {
        const servicio = selectServicio.value;
        const fecha = fechaInput.value;
        const hora = horaInput.value;

        if (!servicio || !fecha || !hora)
            return alerta("Completá todos los datos", "error");

        const existe = turnos.some(turno =>
            turno.usuarioId === usuarioActivo.id &&
            turno.fecha === fecha &&
            turno.hora === hora &&
            (!turnoEditando || turno.id !== turnoEditando.id)
        );

        if (existe)
            return alerta("Ya tenés un turno en ese horario", "error");

        if (turnoEditando) {
            Object.assign(turnoEditando, { servicio, fecha, hora });
            turnoEditando = null;
            alerta("Turno editado");
        } else {
            turnos.push({
                id: Date.now(),
                usuarioId: usuarioActivo.id,
                servicio,
                fecha,
                hora
            });
            alerta("Turno agregado");
        }

        guardarTurnos();
        selectServicio.value = fechaInput.value = horaInput.value = "";
        render();
    });


    // RENDER CENTRAL
    const render = () => {
        mostrarTurnos();
        mostrarStats();
        mostrarMasSolicitado();
    };

    // LISTAS
    const mostrarTurnos = () => {
        listaTurnos.innerHTML = "";

        const propios = turnos
            .filter(turno => turno.usuarioId === usuarioActivo.id)
            .filter(turno => turno.servicio.toLowerCase().includes(filtroActual));

        if (!propios.length) {
            listaTurnos.innerHTML = "<p class='text-muted'>No hay turnos</p>";
            return;
        }

        propios.forEach(turno => {
            listaTurnos.innerHTML += `
            <div class="turno-item border rounded p-2 mb-2 d-flex justify-content-between">
                <div>
                    <strong>${turno.servicio}</strong><br>
                    ${turno.fecha} - ${turno.hora}
                </div>
                <div>
                    <button class="btn btn-warning btn-sm editar" data-id="${turno.id}">Editar</button>
                    <button class="btn btn-danger btn-sm borrar" data-id="${turno.id}">X</button>
                </div>
            </div>
        `;
        });
    };

    // ELIMINACIÓN TURNOS
    listaTurnos.addEventListener("click", event => {
        const id = Number(event.target.dataset.id);

        if (event.target.classList.contains("borrar")) {
            Swal.fire({
                title: "¿Eliminar turno?",
                text: "Esta acción no se puede deshacer",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Sí, eliminar",
                cancelButtonText: "Cancelar",
                reverseButtons: true
            }).then(result => {
                if (result.isConfirmed) {
                    turnos = turnos.filter(turno => turno.id !== id);
                    guardarTurnos();
                    render();

                    Swal.fire({
                        icon: "success",
                        title: "Turno eliminado",
                        timer: 1200,
                        showConfirmButton: false
                    });
                }
            });
        }


        if (event.target.classList.contains("editar")) {
            turnoEditando = turnos.find(turno => turno.id === id);
            selectServicio.value = turnoEditando.servicio;
            fechaInput.value = turnoEditando.fecha;
            horaInput.value = turnoEditando.hora;
            alerta("Editando turno", "info");
        }
    });

    // BUSCADOR
    buscarInput.addEventListener("input", event => {
        filtroActual = event.target.value.toLowerCase();
        mostrarTurnos();
    });

    // ESTADISTICAS
    const mostrarStats = () => {
        const total = turnos.filter(turno => turno.usuarioId === usuarioActivo.id).length;
        stats.innerHTML = `Total de turnos: <strong>${total}</strong>`;
    };

    // TURNOS MAS SOLICITADOS
    const mostrarMasSolicitado = () => {
        const propios = turnos.filter(turno => turno.usuarioId === usuarioActivo.id);
        if (!propios.length) {
            masSolicitado.textContent = "";
            return;
        }

        const contador = {};
        propios.forEach(turno => {
            contador[turno.servicio] = (contador[turno.servicio] || 0) + 1;
        });

        const max = Math.max(...Object.values(contador));
        const masUsados = Object.keys(contador)
            .filter(servicio => contador[servicio] === max);

        masSolicitado.innerHTML =
            `Turno más solicitado: <strong>${masUsados.join(", ")}</strong> (${max})`;
    };

});
