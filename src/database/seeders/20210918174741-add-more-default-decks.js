/* eslint-disable */
'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const decks = await queryInterface.bulkInsert(
      'Decks',
      [
        {
          title: 'Burning bridges',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          title: 'We’e Not Really Strangers',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      { returning: true }
    );

    const bridgesdeckId = decks[0]['id'];
    const stragersDeckId = decks[1]['id'];

    await queryInterface.bulkInsert('Questions', [
      {
        question:
          "What's your favorite song lyric you can think of off the top of your head?",
        deckId: stragersDeckId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        question: "I know I'm in love when _____________",
        deckId: stragersDeckId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        question: 'How did you get over your first love?',
        deckId: stragersDeckId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        question: 'Are you lying to yourself about anything?',
        deckId: stragersDeckId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        question: "What's the best lesson an ex has ever taught you?",
        deckId: stragersDeckId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        question: 'What do you need right now, more than anything?',
        deckId: stragersDeckId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        question:
          "Is there anyone who's changed your life but doesn't know it?",
        deckId: stragersDeckId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        question: 'When was the last time you felt lucky to be you?',
        deckId: stragersDeckId,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      {
        question:
          'What’s the most embarrassing thing your parents have caught you doing?',
        deckId: bridgesdeckId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        question: 'What’s the biggest romantic fail you’ve ever experienced?',
        deckId: bridgesdeckId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        question: 'What’s the weirdest thing you’ve done when you were alone?',
        deckId: bridgesdeckId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        question: 'What’s the meanest thing you’ve ever said to someone?',
        deckId: bridgesdeckId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        question:
          'What’s the biggest lie you’ve ever told without getting caught?',
        deckId: bridgesdeckId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        question:
          'What’s the biggest secret you’ve ever kept from your parents?',
        deckId: bridgesdeckId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        question: 'What’s the most disgusting thing you’ve ever done?',
        deckId: bridgesdeckId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        question: 'What’s the cruelest thing you’ve ever done to a friend?',
        deckId: bridgesdeckId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        question: 'If you had to shoot someone in this room, who would it be?',
        deckId: bridgesdeckId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        question:
          'If you had to had to steal money from someone in this room, who would it be?',
        deckId: bridgesdeckId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        question: 'Who in the room do you like the least?',
        deckId: bridgesdeckId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        question: 'Who do you think will end up being a loser in life?',
        deckId: bridgesdeckId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    const Op = Sequelize.Op;

    await queryInterface.bulkDelete(
      'Decks',
      {
        userId: null,
        [Op.or]: [
          { title: 'Burning bridges' },
          { title: 'We’e Not Really Strangers' }
        ]
      },
      {}
    );

    // Questions will be deleted due to cascade
  }
};
