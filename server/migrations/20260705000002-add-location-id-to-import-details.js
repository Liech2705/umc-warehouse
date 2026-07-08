'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('import_details');
    if (!tableInfo.location_id) {
      await queryInterface.addColumn('import_details', 'location_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'locations',
          key: 'location_id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }
  },

  async down(queryInterface) {
    const tableInfo = await queryInterface.describeTable('import_details');
    if (tableInfo.location_id) {
      await queryInterface.removeColumn('import_details', 'location_id');
    }
  },
};
