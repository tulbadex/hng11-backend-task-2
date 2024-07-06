const { validateOrganisation } = require('../validation');
const { v4: uuidv4 } = require('uuid');

const { sequelize } = require('../config/database');
const pool = require('../config/database'); 

const User = require('../models/user');
const Organisation = require('../models/organisation');
const UserOrganisation = require('../models/userOrganisation')

const formatValidationErrors = (details) => {
  return details.map((err) => ({
    field: err.path[0],
    message: err.message.replace(/['"]/g, ''),
  }));
};

exports.getOrganisations = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Query to get user details
    const userQuery = `
      SELECT "userId", "firstName", "lastName", "email", "phone"
      FROM "Users"
      WHERE "userId" = :userId
    `;

    const userRows  = await sequelize.query(userQuery, {
      replacements: { userId },
      type: sequelize.QueryTypes.SELECT
    });

    if (!userRows || userRows.length === 0) {
      return res.status(404).json({ status: 'Bad request', message: 'User not found', statusCode: 404 });
    }

    const organisationsQuery = `
      SELECT o."orgId", o."name", o."description"
      FROM "UserOrganisations" uo
      JOIN "Organisations" o ON o."orgId" = uo."orgId"
      WHERE uo."userId" = :userId
    `;

    const organisations = await sequelize.query(organisationsQuery, {
      replacements: { userId },
      type: sequelize.QueryTypes.SELECT
    });



    if (!organisations || organisations.length === 0) {
      return res.status(404).json({ status: 'Bad request', message: 'No organisations found for this user', statusCode: 404 });
    }

    const formattedOrganisations = organisations.map(org => ({
      orgId: org.orgId,
      name: org.name,
      description: org.description,
    }));

    res.status(200).json({
      status: 'success',
      message: 'Organisations fetched successfully',
      data: {
        organisations: formattedOrganisations,
      },
    });
  } catch (err) {
    console.error('Error fetching organisations:', err);
    res.status(500).json({ status: 'Bad request', message: 'Could not fetch organisations', statusCode: 500 });
  }
};


exports.getOrganisation = async (req, res) => {
  try {
    const userId = req.user.userId;
    const orgId = req.params.orgId;

    const checkOrganisationQuery = `
      SELECT o."orgId", o."name", o."description"
      FROM "Organisations" o
      JOIN "UserOrganisations" uo ON o."orgId" = uo."orgId"
      WHERE o."orgId" = :orgId AND uo."userId" = :userId
    `;

    const organisation  = await sequelize.query(checkOrganisationQuery, {
      replacements: { orgId, userId },
      type: sequelize.QueryTypes.SELECT
    });

    if (!organisation || organisation.length === 0) {
      return res.status(404).json({ status: 'Bad request', message: 'Organisation not found', statusCode: 404 });
    }

    res.status(200).json({
      status: 'success',
      message: 'Organisation fetched successfully',
      data: {
        orgId: organisation.orgId,
        name: organisation.name,
        description: organisation.description,
      },
    });
  } catch (err) {
    console.error('Error fetching organisation:', err); // Log the error for debugging
    res.status(400).json({ status: 'Bad request', message: 'Could not fetch organisation', statusCode: 400 });
  }
};



exports.createOrganisation = async (req, res) => {
  const userId = req.user.userId;

  const { error } = validateOrganisation(req.body);
  if (error) return res.status(422).json({ errors: formatValidationErrors(error.details) });

  try {
    const { name, description } = req.body;
    const orgId = uuidv4();

    const organisation = await Organisation.create({ orgId, userId, name, description });

    if (!organisation) {
      return res.status(404).json({ status: 'Bad request', message: 'Client error', statusCode: 400 });
    }

    // Associate user with organisation
    await UserOrganisation.create({
      userId: userId,
      orgId: organisation.orgId,
    });

    res.status(201).json({
      status: 'success',
      message: 'Organisation created successfully',
      data: {
        orgId: organisation.orgId,
        name: organisation.name,
        description: organisation.description,
      },
    });
  } catch (err) {
    res.status(400).json({ status: 'Bad Request', message: 'Client error', statusCode: 400 });
  }
};

exports.addUserToOrganisation = async (req, res) => {
  try {
    const user = await User.findByPk(req.body.userId);
    const organisation = await Organisation.findByPk(req.params.orgId);

    if (!user || !organisation) {
      return res.status(404).json({ status: 'Bad request', message: 'User or Organisation not found', statusCode: 404 });
    }

    // Associate user with organisation
    await UserOrganisation.create({
      userId: user.userId,
      orgId: organisation.orgId,
    });

    res.status(200).json({
      status: 'success',
      message: 'User added to organisation successfully',
    });
  } catch (err) {
    res.status(400).json({ status: 'Bad Request', message: 'Client error', statusCode: 400 });
  }
};