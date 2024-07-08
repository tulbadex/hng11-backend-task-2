const { validateOrganisation } = require('../validation');
const { v4: uuidv4 } = require('uuid');

const { sequelize } = require('../config/database');
const pool = require('../config/database'); 

const { User, Organisation, UserOrganisation } = require("../models");

const formatValidationErrors = (details) => {
  return details.map((err) => ({
    field: err.path[0],
    message: err.message.replace(/['"]/g, ''),
  }));
};

exports.getOrganisations = async (req, res) => {
  try {
		const organisations = await Organisation.findAll({
			include: [
				{
					model: User,
					where: { userId: req.user.userId },
					attributes: [],
					through: {
						attributes: [],
					},
				},
			],
		});
    
    res.status(200).json({
      status : "success",
      message: "Organisations fetched successfully",
      data: {
        organisations
      }
    })
	} catch (error) {
    return res.status(400).json({ status: 'Bad request', message: 'Client error', statusCode: 400 });
	}
};


exports.getOrganisation = async (req, res) => {
  const { orgId } = req.params;
	try {
		const organisation = await Organisation.findOne({
			where: { orgId },
			include: [
				{
					model: User,
					attributes: [],
					through: {
						model: UserOrganisation,
						where: { userId: req.user.userId },
						attributes: [],
					},
				},
			],
		});

		if (!organisation) {
      return res.status(404).json({
        status: 'Not Found',
        message: "Organisation not found",
        statusCode: 404
      })
		}

    return res.status(200).json({
      status: 'success',
      message: "Organisation fetched successfully",
      statusCode: 200
    })
	} catch (error) {
    res.status(400).json({
      staus: 'Bad Request',
      message: "Client error",
      statusCode: 400
    })
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