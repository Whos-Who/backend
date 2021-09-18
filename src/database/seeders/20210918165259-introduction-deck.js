'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const decks = await queryInterface.bulkInsert(
      'Decks',
      [
        {
          title: 'Easy questions for strangers',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      { returning: true }
    );

    const deckId = decks[0]['id'];

    await queryInterface.bulkInsert('Questions', [
      {
        question: 'What’s your favorite way to spend a day off?',
        deckId: deckId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        question: 'What type of music are you into?',
        deckId: deckId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        question: 'What was the best vacation you ever took and why?',
        deckId: deckId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        question: 'Where’s the next place on your travel bucket list and why?',
        deckId: deckId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        question: 'What are your hobbies, and how did you get into them?',
        deckId: deckId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        question: 'What was the last thing you read?',
        deckId: deckId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        question: 'Would you say you’re more of an extrovert or an introvert?',
        deckId: deckId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        question:
          'If you could only eat one food for the rest of your life, what would it be?',
        deckId: deckId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        question: 'What’s your guilty pleasure?',
        deckId: deckId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        question: 'Do you have any pet peeves?',
        deckId: deckId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete(
      'Decks',
      {
        userId: null,
        title: 'Easy questions for strangers'
      },
      {}
    );

    // Questions will be deleted due to cascade
  }
};
