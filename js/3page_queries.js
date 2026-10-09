async function cargarEquipos() {

    const { data, error } = await supabaseClient
        .from("equipos")
        .select(`
            *,
            marcas (
                Marca
            ),
            estado_equipo (
                Estado
            )
        `);

    if (error) {
        console.error("Error al obtener los equipos:", error);
        return;
    }

    console.log(data);

    const tabla = document.getElementById("tablaEquipos");

    tabla.innerHTML = "";

    data.forEach(equipo => {

        const fila = document.createElement("tr");

        fila.innerHTML = `
            <td>${equipo.idEquipo}</td>
            <td>${equipo.Nombre ?? ""}</td>
            <td>${equipo.Descripcion ?? ""}</td>

            <td>${equipo.marcas?.Marca ?? ""}</td>

            <td>${equipo.Modelo ?? ""}</td>
            <td>${equipo.CodigoActivo ?? ""}</td>
            <td>${equipo.NumeroSerie ?? ""}</td>
            <td>${equipo.FechaRegistro ?? ""}</td>

            
            <td>${equipo.estado_equipo?.Estado ?? ""}</td>

            <td>${equipo.Responsable ?? ""}</td>
            <td>${equipo.FechaCompra ?? ""}</td>
            <td>${equipo.Ubicacion ?? ""}</td>
            <td>${equipo.Observaciones ?? ""}</td>
            <td>${equipo.Activo ? "Sí" : "No"}</td>
        `;

        tabla.appendChild(fila);
    });
}

cargarEquipos();

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