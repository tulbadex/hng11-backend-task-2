const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Organisation, UserOrganisation } = require("../models");
const { v4: uuidv4 } = require('uuid');
const { validateRegistration, validateLogin } = require('../validation');

const formatValidationErrors = (details) => {
  return details.map((err) => ({
    field: err.path[0],
    message: err.message.replace(/['"]/g, ''),
  }));
};

exports.register = async (req, res) => {
  const { error } = validateRegistration(req.body);
  if (error) {
    return res.status(422).json({ errors: formatValidationErrors(error.details) });
  }

  try {
    const { firstName, lastName, email, password, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(422).json({ errors: [{ field: 'email', message: 'Email already exists' }] });
    }

    // Create user
    const newUser = await User.create({
      userId: uuidv4(),
      firstName,
      lastName,
      email,
      password,
      phone: phone || null,
    });

    // Create default organisation
    const newOrganisation = await Organisation.create({
      orgId: uuidv4(),
      name: `${firstName}'s Organisation`,
      description: '',
      userId: newUser.userId, // Assuming `Organisation` model has `userId` field for creator
    });

    // Associate user with organisation
    await UserOrganisation.create({
      userId: newUser.userId,
      orgId: newOrganisation.orgId,
    });

    // Generate JWT token
    const token = jwt.sign({ userId: newUser.userId, email: newUser.email }, process.env.JWT_SECRET, { expiresIn: '23h' });

    // Return success response
    res.status(201).json({
      status: 'success',
      message: 'Registration successful',
      data: {
        accessToken: token,
        user: {
          userId: newUser.userId,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          phone: newUser.phone,
        }
      }
    });
  } catch (err) {
    console.error('Registration error:', err); // Log the error for debugging
    res.status(400).json({ status: 'Bad request', message: 'Registration unsuccessful', statusCode: 400 });
  }
};

exports.login = async (req, res) => {
  const { error } = validateLogin(req.body);
  if (error) return res.status(422).json({ errors: formatValidationErrors(error.details) });

  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ status: 'Bad request', message: 'Authentication failed', statusCode: 401 });
    }

    const token = jwt.sign({ userId: user.userId, email: user.email }, process.env.JWT_SECRET, { expiresIn: '23h' });

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        accessToken: token,
        user: {
          userId: user.userId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
        }
      }
    });
  } catch (err) {
    res.status(401).json({ status: 'Bad request', message: 'Authentication failed', statusCode: 401 });
  }
};


exports.getUserDetails = async (req, res) => {
  const { id } = req.params;
	const { userId } = req.user;

	try {
		const user = await User.findByPk(id, {
			attributes: ["userId", "firstName", "lastName", "email", "phone"],
		});

		if (!user) {
      return res.status(404).json({ status: 'Bad request', message: 'User not found', statusCode: 404 });
		}

		if (user.userId === userId) {
      return res.status(200).json({
            status: 'success',
            message: 'User record retrieved successfully',
            data: {
              userId: user.userId,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              phone: user.phone,
            }
        });
		}

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

		const isPartOfOrganisation = await UserOrganisation.findOne({
			where: {
				userId: id,
				orgId: organisations.map((org) => org.orgId),
			},
		});

		if (isPartOfOrganisation) {
      return res.status(200).json({
          status: 'success',
          message: 'User record retrieved successfully',
          data: {
            userId: user.userId,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
          }
      });
		}

    return res.status(403).json({ status: 'Bad request', message: 'Client erro', statusCode: 403 });
	} catch (error) {
    return res.status(400).json({ status: 'Bad request', message: 'Client error', statusCode: 400 });
	}
}