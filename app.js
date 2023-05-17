const express = require('express');
const flash = require('express-flash');
const session = require('express-session');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const app = express();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const pool = require('./db');

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());


app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));



app.use(flash());
app.use(passport.initialize());
app.use(passport.session());



// Ruta de inicio de sesión
app.post('/login', async (req, res, next) => {
    console.log(req.params)
    console.log(req.body.correo_electronico)
    console.log(req.body.contrasena)

    const email = req.body.correo_electronico;
  const password = req.body.contrasena;

  try {
    const connection = await pool.getConnection();
    const [rows, fields] = await connection.execute('SELECT * FROM usuarios WHERE correo_electronico = ?', [email]);
    connection.release();

    if (rows.length === 0) {
      // El usuario no existe en la base de datos
      return res.status(401).json({ message: 'Correo electrónico o contraseña incorrectos.' });
    }

    const user = rows[0];
    console.log(user)

    if (user.contrasena !== password) {
      // La contraseña no coincide
      return res.status(401).json({ message: 'Correo electrónico o contraseña incorrectos.' });
    }

    // Autenticación exitosa
    return res.status(200).json({ message: 'Autenticación exitosa.' });

  } catch (error) {
    console.error('Error al autenticar usuario:', error);
    return res.status(500).json({ message: 'Error al autenticar usuario.' });
  }

  
  });
  
  app.get('/dashboard', (req, res) => {
    if (req.isAuthenticated()) {
      res.send('Bienvenido al panel de control.');
    } else {
      res.redirect('/login');
    }
  });

// Logout route
app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/login');
});


async function testDatabaseConnection() {
    try {
        const [results, fields] = await pool.query('SELECT * FROM usuarios');
        console.log('The solution is: ', results);
    } catch (error) {
        console.error('Error querying the database: ', error);
    }
}

// testDatabaseConnection();

app.listen(3000, () => {
    console.log('Server listening on port 3000');
});