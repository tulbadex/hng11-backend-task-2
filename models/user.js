 'use strict';
const { DataTypes } = require('sequelize');
const {sequelize} = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  userId: {
    type: DataTypes.STRING,
    primaryKey: true,
    unique: true,
    allowNull: false
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

User.beforeCreate(async (user) => {
  user.password = await bcrypt.hash(user.password, 10);
});

User.associate = models => {
  User.belongsToMany(models.Organisation, { 
    through: { model: models.UserOrganisation }, 
    foreignKey: 'userId', 
    otherKey: 'orgId'
  });
  // User.hasMany(models.UserOrganisation)
  // User.hasMany(models.Organisation)
};

module.exports = User;
