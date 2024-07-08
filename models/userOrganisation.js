'use strict';

const { DataTypes } = require('sequelize');
const {sequelize} = require('../config/database');

const UserOrganisation = sequelize.define('UserOrganisation', {
  // Additional attributes can be added here if needed
  orgId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: false
  },
});

module.exports = UserOrganisation;
