import Sequelize from 'sequelize';
import sequelize from '../database/sequelize';
import Deck from './Deck';

const User = sequelize.define('Users', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: Sequelize.STRING
  },
  email: {
    type: Sequelize.STRING
  },
  password: {
    type: Sequelize.STRING
  }
});

User.hasMany(Deck, { foreignKey: 'userId' });
Deck.belongsTo(User, { foreignKey: 'userId' });

export default User;
