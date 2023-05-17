const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const pool = require('./db');

passport.use(
  new LocalStrategy(
    {
      usernameField: 'email', // Campo para el correo electrónico en el formulario de inicio de sesión
      passwordField: 'password', // Campo para la contraseña en el formulario de inicio de sesión
    },
    async (email, password, done) => {
      try {
        const connection = await pool.getConnection();
        const [rows, fields] = await connection.execute('SELECT * FROM usuarios WHERE correo_electronico = ?', [email]);
        connection.release();

        if (rows.length === 0) {
          return done(null, false, { message: 'Correo electrónico incorrecto.' });
        }

        const user = rows[0];
        if (user.contrasena !== password) {
          return done(null, false, { message: 'Contraseña incorrecta.' });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

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

module.exports = passport;
