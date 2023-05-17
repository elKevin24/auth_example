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
// Configura Passport
app.use(passport.initialize());
app.use(passport.session());

// Configura estrategia de autenticación local
passport.use(new LocalStrategy({
    usernameField: 'correo_electronico',
    passwordField: 'contrasena'
  },
  async (email, password, done) => {
    try {
      const connection = await pool.getConnection();
      const [rows, fields] = await connection.execute('SELECT * FROM usuarios WHERE correo_electronico = ?', [email]);
      connection.release();

      if (rows.length === 0) {
        return done(null, false, { message: 'Correo electrónico o contraseña incorrectos.' });
      }

      const user = rows[0];

      if (user.contrasena !== password) {
        return done(null, false, { message: 'Correo electrónico o contraseña incorrectos.' });
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

// Serialize user para almacenar en sesión
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user para recuperar desde sesión
passport.deserializeUser(async (id, done) => {
  try {
    const connection = await pool.getConnection();
    const [rows, fields] = await connection.execute('SELECT * FROM usuarios WHERE id = ?', [id]);
    connection.release();

    if (rows.length === 0) {
      return done(null, false);
    }

    const user = rows[0];
    return done(null, user);
  } catch (error) {
    return done(error);
  }
});
  app.post('/login', passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/login',
  }));
  
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