const ADMIN_EMAIL = 'alejandrosolanor@gmail.com';
const formularioLogin = document.getElementById('login-form');
const mensajeError = document.getElementById('mensaje-error');

formularioLogin.addEventListener('submit', async function (e) {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const boton = formularioLogin.querySelector('button[type="submit"]');
    boton.disabled = true;
    mensajeError.textContent = '';

    let data;
    try {
        const resultado = await supabaseClient.auth.signInWithPassword({ email, password });
        if (resultado.error) {
            console.error('Error al iniciar sesión:', resultado.error);
            mensajeError.textContent = 'No se pudo iniciar sesión. Verifica el correo y la contraseña.';
            boton.disabled = false;
            return;
        }
        data = resultado.data;
    } catch (error) {
        console.error('Error de conexión al iniciar sesión:', error);
        mensajeError.textContent = 'No fue posible conectar con el servicio de autenticación. Intenta de nuevo.';
        boton.disabled = false;
        return;
    }

    if (data.user.email?.toLowerCase() !== ADMIN_EMAIL) {
        try {
            const { error: signOutError } = await supabaseClient.auth.signOut();
            if (signOutError) {
                console.error('Error al cerrar una sesión sin acceso de administrador:', signOutError);
            }
        } catch (error) {
            console.error('Error al cerrar una sesión sin acceso de administrador:', error);
        }
        mensajeError.textContent = 'Esta cuenta no tiene acceso al panel de administración.';
        boton.disabled = false;
        return;
    }

    window.location.href = '../html/4page_admin.html';
});

document.getElementById('button-next-section').onclick = function () {
    window.location.href = '../html/2page_homepage.html';
};