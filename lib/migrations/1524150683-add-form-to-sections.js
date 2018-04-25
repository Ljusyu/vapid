module.exports = {
  up: (queryInterface, Sequelize) => [
    queryInterface.addColumn('sections', 'form', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    }),
  ],

  down: queryInterface => [
    queryInterface.removeColumn('sections', 'form'),
  ],
};
