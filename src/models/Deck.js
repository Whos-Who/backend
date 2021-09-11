import Sequelize from 'sequelize';
import sequelize from '../database/sequelize';
import Question from './Question';

const Deck = sequelize.define('Decks', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  title: {
    type: Sequelize.STRING
  },
  isPublic: {
    type: Sequelize.BOOLEAN
  },
  userId: {
    type: Sequelize.INTEGER,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
});

Deck.hasMany(Question, { foreignKey: 'deckId' });
Question.belongsTo(Deck, { foreignKey: 'deckId' });

export default Deck;
