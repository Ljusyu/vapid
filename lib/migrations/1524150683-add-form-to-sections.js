module.exports = {
  up: (queryInterface, Sequelize) => {
    return [
      queryInterface.addColumn('sections', 'form', {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      })
    ]
  },

  down: (queryInterface, DataType) => {
    return [
      queryInterface.removeColumn('sections', 'form')
    ]
  }
}