'use strict';

const { DataTypes } = require('sequelize');
const {sequelize} = require('../config/database');

const Organisation = sequelize.define('Organisation', {
  orgId: {
    type: DataTypes.STRING,
    primaryKey: true,
    unique: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false
  },
});

Organisation.associate = function(models) {
  /* Organisation.belongsToMany(models.User, { 
    through: models.UserOrganisation, 
    foreignKey: 'orgId',
    otherKey: 'userId',
  }); */
  Organisation.hasOne(models.User)
};

module.exports = Organisation;
