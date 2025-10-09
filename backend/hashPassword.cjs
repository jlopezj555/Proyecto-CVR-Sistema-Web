// hashPassword.cjs
const bcrypt = require("bcrypt");

const password = "admin123"; // Cambia esta contraseña si quieres
const saltRounds = 10;

bcrypt.hash(password, saltRounds)
  .then(hash => {
    console.log("Contraseña original:", password);
    console.log("Hash generado:", hash);
    console.log("\n--- Script SQL ---");
    console.log(`INSERT INTO Empleado (nombre, apellido, correo, contrasena) VALUES ('Admin', 'Sistema', 'admin@cvrasesoria.com', '${hash}');`);
    console.log(`INSERT INTO Usuario (nombre_completo, correo, contrasena, tipo_usuario, id_empleado, activo) VALUES ('Admin Sistema', 'admin@cvrasesoria.com', '${hash}', 'administrador', LAST_INSERT_ID(), TRUE);`);
  })
  .catch(err => {
    console.error("Error al generar hash:", err);
  });


