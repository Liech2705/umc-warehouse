require('dotenv').config();
const app = require('./src/app');
const sequelize = require('./src/config/db');

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Unable to connect to database:', err.message);
    process.exit(1);
  }
})();
