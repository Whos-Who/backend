import Sequelize from 'sequelize';
import sequelize from '../database/sequelize';

const Question = sequelize.define('Questions', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  question: {
    type: Sequelize.STRING
  },
  deckId: {
    type: Sequelize.INTEGER,
    references: {
      model: 'Decks',
      key: 'id'
    },
    allowNull: false
  }
});

export default Question;
