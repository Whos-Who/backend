'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Users', 'username', {
      type: Sequelize.STRING,
      allowNull: false
    });

    await queryInterface.changeColumn('Users', 'password', {
      type: Sequelize.STRING,
      allowNull: false
    });

    await queryInterface.changeColumn('Users', 'email', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Users', 'username', {
      type: Sequelize.STRING
    });

    await queryInterface.changeColumn('Users', 'password', {
      type: Sequelize.STRING
    });

    await queryInterface.changeColumn('Users', 'email', {
      type: Sequelize.STRING
    });
  }
};
