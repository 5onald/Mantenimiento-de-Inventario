document.getElementById('login-form').onsubmit = function (e) {
    e.preventDefault();
    var usuario = document.getElementById('usuario').value.trim();
    var password = document.getElementById('password').value;
    var mensaje = document.getElementById('mensaje-error');

    if (usuario === 'alejandrosolanor' && password === 'Huq73627') {
        localStorage.setItem('logueando', 'si');
        location.href = '../html/pag_admin.html';
    } else {
        mensaje.textContent = 'Usuario o contraseña incorrecta';
    }
}

document.getElementById('button-next-section').onclick = function () {
    location.href = '../html/page_homepage.html'
}