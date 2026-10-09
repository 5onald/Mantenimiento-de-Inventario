const tablaEquipos = document.getElementById("tablaEquipos");
const mensaje = document.getElementById("mensaje");
const buscarEquipo = document.getElementById("buscarEquipo");
const filtroMarca = document.getElementById("filtroMarca");
const filtroEstado = document.getElementById("filtroEstado");
const formularioEquipo = document.getElementById("formularioEquipo");
const dialogoEquipo = document.getElementById("dialogoEquipo");
const mensajeFormulario = document.getElementById("mensajeFormulario");
const equipos = [];
const ADMIN_EMAIL = "alejandrosolanor@gmail.com";
let equipoEnEdicion = null;

verificarSesionAdministrador();

document.getElementById("cerrarSesion").addEventListener("click", async evento => {
    evento.preventDefault();
    try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) {
            console.error("Error al cerrar sesión:", error);
            mensaje.textContent = "No fue posible cerrar la sesión. Intenta de nuevo.";
            return;
        }
        window.location.replace("../html/1page_login.html");
    } catch (error) {
        console.error("Error al cerrar sesión:", error);
        mensaje.textContent = "No fue posible cerrar la sesión. Intenta de nuevo.";
    }
});

async function verificarSesionAdministrador() {
    try {
        const { data, error } = await supabaseClient.auth.getUser();
        if (error) {
            console.error("Error al verificar la sesión:", error);
            window.location.replace("../html/1page_login.html");
            return;
        }
        if (data.user?.email?.toLowerCase() !== ADMIN_EMAIL) {
            window.location.replace("../html/1page_login.html");
            return;
        }

        iniciarAdministracion();
        suscribirCambios();
    } catch (error) {
        console.error("Error al verificar la sesión:", error);
        window.location.replace("../html/1page_login.html");
    }
}

function normalizarTexto(valor) {
    return String(valor ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase();
}

function agregarCelda(fila, valor) {
    const celda = document.createElement("td");
    celda.textContent = String(valor ?? "");
    fila.appendChild(celda);
}

function mostrarEquipos() {
    const busqueda = normalizarTexto(buscarEquipo.value.trim());
    const marcaSeleccionada = filtroMarca.value;
    const estadoSeleccionado = filtroEstado.value;
    const resultados = equipos.filter(equipo => {
        const coincideMarca = !marcaSeleccionada
            || String(equipo.marcas?.idMarcas ?? "") === marcaSeleccionada;
        const coincideEstado = !estadoSeleccionado
            || String(equipo.estado_equipo?.idEstado ?? "") === estadoSeleccionado;
        const textoEquipo = [
            equipo.idEquipo,
            equipo.Nombre,
            equipo.Descripcion,
            equipo.marcas?.Marca,
            equipo.Modelo,
            equipo.CodigoActivo,
            equipo.NumeroSerie,
            equipo.FechaRegistro,
            equipo.estado_equipo?.Estado,
            equipo.Responsable,
            equipo.FechaCompra,
            equipo.Ubicacion,
            equipo.Observaciones,
            equipo.Activo ? "Sí" : "No"
        ].map(normalizarTexto).join(" ");

        return coincideMarca && coincideEstado && textoEquipo.includes(busqueda);
    });

    tablaEquipos.replaceChildren();
    resultados.forEach(equipo => {
        const fila = document.createElement("tr");
        [
            equipo.idEquipo,
            equipo.Nombre,
            equipo.Descripcion,
            equipo.marcas?.Marca,
            equipo.Modelo,
            equipo.CodigoActivo,
            equipo.NumeroSerie,
            equipo.FechaRegistro,
            equipo.estado_equipo?.Estado,
            equipo.Responsable,
            equipo.FechaCompra,
            equipo.Ubicacion,
            equipo.Observaciones,
            equipo.Activo ? "Sí" : "No"
        ].forEach(valor => agregarCelda(fila, valor));

        const celdaAcciones = document.createElement("td");
        const acciones = document.createElement("div");
        acciones.className = "acciones-tabla";
        const botonEditar = document.createElement("button");
        botonEditar.type = "button";
        botonEditar.textContent = "Editar";
        botonEditar.setAttribute("aria-label", `Editar equipo ${equipo.Nombre ?? equipo.idEquipo}`);
        botonEditar.addEventListener("click", () => abrirFormulario(equipo));

        const botonEliminar = document.createElement("button");
        botonEliminar.type = "button";
        botonEliminar.className = "boton-eliminar";
        botonEliminar.textContent = "Eliminar";
        botonEliminar.setAttribute("aria-label", `Eliminar equipo ${equipo.Nombre ?? equipo.idEquipo}`);
        botonEliminar.addEventListener("click", () => eliminarEquipo(equipo));

        acciones.append(botonEditar, botonEliminar);
        celdaAcciones.appendChild(acciones);
        fila.appendChild(celdaAcciones);
        tablaEquipos.appendChild(fila);
    });

    mensaje.textContent = resultados.length
        ? `Mostrando ${resultados.length} de ${equipos.length} equipos.`
        : "No se encontraron equipos con esos criterios.";
}

function cargarOpciones(select, opciones, idCampo, textoCampo, textoInicial) {
    select.replaceChildren();
    const inicial = document.createElement("option");
    inicial.value = "";
    inicial.textContent = textoInicial;
    select.appendChild(inicial);

    opciones.forEach(opcion => {
        const elemento = document.createElement("option");
        elemento.value = String(opcion[idCampo]);
        elemento.textContent = opcion[textoCampo] ?? "";
        select.appendChild(elemento);
    });
}

async function cargarEquipos() {
    const { data, error } = await supabaseClient
        .from("equipos")
        .select(`
            *,
            marcas (
                idMarcas,
                Marca
            ),
            estado_equipo (
                idEstado,
                Estado
            )
        `)
        .order("idEquipo", { ascending: true });

    if (error) {
        console.error("Error al obtener los equipos:", error);
        mensaje.textContent = "No fue posible cargar los equipos. Intenta de nuevo más tarde.";
        return false;
    }

    equipos.splice(0, equipos.length, ...data);
    mostrarEquipos();
    return true;
}

async function cargarOpcionesFiltro() {
    const [marcasResultado, estadosResultado] = await Promise.all([
        supabaseClient.from("marcas").select("idMarcas, Marca").order("Marca"),
        supabaseClient.from("estado_equipo").select("idEstado, Estado").order("Estado")
    ]);
    const errores = [];

    if (marcasResultado.error) {
        console.error("Error al obtener las marcas:", marcasResultado.error);
        errores.push("marcas");
    } else {
        cargarOpciones(filtroMarca, marcasResultado.data, "idMarcas", "Marca", "Todas las marcas");
        cargarOpciones(
            formularioEquipo.elements.idMarcas,
            marcasResultado.data,
            "idMarcas",
            "Marca",
            "Sin marca"
        );
    }

    if (estadosResultado.error) {
        console.error("Error al obtener los estados:", estadosResultado.error);
        errores.push("estados");
    } else {
        cargarOpciones(filtroEstado, estadosResultado.data, "idEstado", "Estado", "Todos los estados");
        cargarOpciones(
            formularioEquipo.elements.idEstado,
            estadosResultado.data,
            "idEstado",
            "Estado",
            "Sin estado"
        );
    }

    if (errores.length) {
        mensaje.textContent = `No fue posible cargar ${errores.join(" ni ")}; los filtros correspondientes no estarán disponibles.`;
    }
    return errores;
}

function seleccionarRelacion(select, id, texto) {
    if (id && !Array.from(select.options).some(opcion => opcion.value === String(id))) {
        const opcion = document.createElement("option");
        opcion.value = String(id);
        opcion.textContent = texto || `Opción ${id}`;
        select.appendChild(opcion);
    }
    select.value = id ? String(id) : "";
}

function abrirFormulario(equipo = null) {
    equipoEnEdicion = equipo;
    formularioEquipo.reset();
    mensajeFormulario.textContent = "";
    document.getElementById("tituloDialogo").textContent = equipo
        ? `Editar equipo #${equipo.idEquipo}`
        : "Agregar equipo";

    if (equipo) {
        formularioEquipo.elements.Nombre.value = equipo.Nombre ?? "";
        formularioEquipo.elements.Descripcion.value = equipo.Descripcion ?? "";
        seleccionarRelacion(
            formularioEquipo.elements.idMarcas,
            equipo.idMarcas ?? equipo.marcas?.idMarcas,
            equipo.marcas?.Marca
        );
        formularioEquipo.elements.Modelo.value = equipo.Modelo ?? "";
        formularioEquipo.elements.CodigoActivo.value = equipo.CodigoActivo ?? "";
        formularioEquipo.elements.NumeroSerie.value = equipo.NumeroSerie ?? "";
        formularioEquipo.elements.FechaRegistro.value = equipo.FechaRegistro?.slice(0, 10) ?? "";
        seleccionarRelacion(
            formularioEquipo.elements.idEstado,
            equipo.idEstado ?? equipo.estado_equipo?.idEstado,
            equipo.estado_equipo?.Estado
        );
        formularioEquipo.elements.Responsable.value = equipo.Responsable ?? "";
        formularioEquipo.elements.FechaCompra.value = equipo.FechaCompra?.slice(0, 10) ?? "";
        formularioEquipo.elements.Ubicacion.value = equipo.Ubicacion ?? "";
        formularioEquipo.elements.Observaciones.value = equipo.Observaciones ?? "";
        formularioEquipo.elements.Activo.value = String(Boolean(equipo.Activo));
    }

    dialogoEquipo.showModal();
}

function crearDatosEquipo() {
    const datos = new FormData(formularioEquipo);
    return {
        Nombre: datos.get("Nombre").trim(),
        Descripcion: datos.get("Descripcion").trim() || null,
        idMarcas: datos.get("idMarcas") || null,
        Modelo: datos.get("Modelo").trim() || null,
        CodigoActivo: datos.get("CodigoActivo").trim() || null,
        NumeroSerie: datos.get("NumeroSerie").trim() || null,
        FechaRegistro: datos.get("FechaRegistro") || null,
        idEstado: datos.get("idEstado") || null,
        Responsable: datos.get("Responsable").trim() || null,
        FechaCompra: datos.get("FechaCompra") || null,
        Ubicacion: datos.get("Ubicacion").trim() || null,
        Observaciones: datos.get("Observaciones").trim() || null,
        Activo: datos.get("Activo") === "true"
    };
}

async function guardarEquipo(evento) {
    evento.preventDefault();
    const botonGuardar = document.getElementById("guardarEquipo");
    botonGuardar.disabled = true;
    mensajeFormulario.textContent = "";
    const datos = crearDatosEquipo();
    const resultado = equipoEnEdicion
        ? await supabaseClient
            .from("equipos")
            .update(datos)
            .eq("idEquipo", equipoEnEdicion.idEquipo)
            .select("idEquipo")
            .single()
        : await supabaseClient
            .from("equipos")
            .insert(datos)
            .select("idEquipo")
            .single();

    if (resultado.error) {
        console.error("Error al guardar el equipo:", resultado.error);
        mensajeFormulario.textContent = "No fue posible guardar el equipo. Revisa los datos e intenta de nuevo.";
        botonGuardar.disabled = false;
        return;
    }

    dialogoEquipo.close();
    await cargarEquipos();
    botonGuardar.disabled = false;
}

async function eliminarEquipo(equipo) {
    const nombre = equipo.Nombre ?? `#${equipo.idEquipo}`;
    if (!window.confirm(`¿Seguro que deseas eliminar el equipo "${nombre}"? Esta acción no se puede deshacer.`)) {
        return;
    }

    const { error } = await supabaseClient
        .from("equipos")
        .delete()
        .eq("idEquipo", equipo.idEquipo)
        .select("idEquipo")
        .single();

    if (error) {
        console.error("Error al eliminar el equipo:", error);
        mensaje.textContent = "No fue posible eliminar el equipo. Intenta de nuevo.";
        return;
    }

    await cargarEquipos();
}

async function iniciarAdministracion() {
    const [erroresFiltros, equiposCargados] = await Promise.all([
        cargarOpcionesFiltro(),
        cargarEquipos()
    ]);
    const errores = [...erroresFiltros];
    if (!equiposCargados) {
        errores.push("equipos");
    }
    if (errores.length) {
        mensaje.textContent = `No fue posible cargar ${errores.join(" ni ")}. Revisa la conexión y los permisos de Supabase.`;
    }
}

buscarEquipo.addEventListener("input", mostrarEquipos);
filtroMarca.addEventListener("change", mostrarEquipos);
filtroEstado.addEventListener("change", mostrarEquipos);
document.getElementById("limpiarFiltros").addEventListener("click", () => {
    buscarEquipo.value = "";
    filtroMarca.value = "";
    filtroEstado.value = "";
    mostrarEquipos();
});
document.getElementById("crearEquipo").addEventListener("click", () => abrirFormulario());
document.getElementById("cerrarDialogo").addEventListener("click", () => dialogoEquipo.close());
document.getElementById("cancelarEquipo").addEventListener("click", () => dialogoEquipo.close());
formularioEquipo.addEventListener("submit", guardarEquipo);

function suscribirCambios() {
    supabaseClient
        .channel("admin-equipos-cambios")
        .on("postgres_changes", { event: "*", schema: "public", table: "equipos" }, cargarEquipos)
        .on("postgres_changes", { event: "*", schema: "public", table: "marcas" }, iniciarAdministracion)
        .on("postgres_changes", { event: "*", schema: "public", table: "estado_equipo" }, iniciarAdministracion)
        .subscribe((status, error) => {
            if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
                console.error("Error en la suscripción en tiempo real:", error ?? status);
                mensaje.textContent = "No fue posible activar la actualización en tiempo real.";
            }
        }
    );
}