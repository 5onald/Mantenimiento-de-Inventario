const SUPABASE_URL = 'https://kprmjuplxnyrszualoce.supabase.co'
const SUPABASE_KEY = 'sb_publishable_Yz30tSFdbqrjFKuamPNvmA_lsJHKbRU'

const supabaseClient = supabase.createClient (
    SUPABASE_URL,
    SUPABASE_KEY
);

const supbase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const tablaEquipos = document.getElementById('tablaEquipos');

async function cargarDatos () {
    const { data, error } = await supabase
    .from('equipos')
    .select('*');

    if (error) {
        console.error('Error al cargar', error);
    } else {
        rendizarDatos();
    }
}

cargarDatos();