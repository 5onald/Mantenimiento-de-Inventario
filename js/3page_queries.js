const tablaEquipos = document.getElementById("tablaEquipos");
const mensaje = document.getElementById("mensaje");
const buscarEquipo = document.getElementById("buscarEquipo");
const filtroMarca = document.getElementById("filtroMarca");
const filtroEstado = document.getElementById("filtroEstado");
const equipos = [];

function normalizarTexto(valor) {
    return String(valor ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase();
}

function crearCelda(fila, valor) {
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
        ].forEach(valor => crearCelda(fila, valor));
        tablaEquipos.appendChild(fila);
    });

    mensaje.textContent = resultados.length
        ? `Mostrando ${resultados.length} de ${equipos.length} equipos.`
        : "No se encontraron equipos con esos criterios.";
}

function cargarOpciones(select, opciones, idCampo, textoCampo) {
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
        return "los equipos";
    }

    equipos.splice(0, equipos.length, ...data);
    mostrarEquipos();
    return null;
}

async function cargarFiltros() {
    const [marcasResultado, estadosResultado] = await Promise.all([
        supabaseClient.from("marcas").select("idMarcas, Marca").order("Marca"),
        supabaseClient.from("estado_equipo").select("idEstado, Estado").order("Estado")
    ]);
    const errores = [];

    if (marcasResultado.error) {
        console.error("Error al obtener las marcas:", marcasResultado.error);
        errores.push("las marcas");
    } else {
        cargarOpciones(filtroMarca, marcasResultado.data, "idMarcas", "Marca");
    }

    if (estadosResultado.error) {
        console.error("Error al obtener los estados:", estadosResultado.error);
        errores.push("los estados");
    } else {
        cargarOpciones(filtroEstado, estadosResultado.data, "idEstado", "Estado");
    }

    return errores;
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

async function iniciarConsulta() {
    const [erroresFiltros, errorEquipos] = await Promise.all([
        cargarFiltros(),
        cargarEquipos()
    ]);
    const errores = [...erroresFiltros];
    if (errorEquipos) {
        errores.push(errorEquipos);
    }

    if (errores.length) {
        mensaje.textContent = `No fue posible cargar ${errores.join(" ni ")}. Intenta de nuevo más tarde.`;
    }
}

iniciarConsulta();

supabaseClient
    .channel("equipos-cambios")
    .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "equipos" },
        () => cargarEquipos()
    )
    .subscribe((status, error) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            console.error("Error en la suscripción en tiempo real:", error ?? status);
        }
    }
);