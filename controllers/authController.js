const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Organisation = require('../models/organisation');
const { v4: uuidv4 } = require('uuid');
const { validateRegistration, validateLogin } = require('../validation');
const UserOrganisation = require('../models/userOrganisation')

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
  const { id } = req.params; // userId to fetch details for
  const loggedInUserId = req.user.userId; // Assuming you get userId from authenticated user

  // Function to check if a string is a valid UUID
  const isUUID = (str) => {
    const regex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    return regex.test(str);
  };

  if (!isUUID(id)) {
    return res.status(422).json({ status: 'Bad request', message: 'Invalid userId format', statusCode: 422 });
  }
  
  try {
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ status: 'Bad request', message: 'User not found', statusCode: 404 });
    }

    // Check if the requested userId matches the authenticated user's userId
    if (user.userId === loggedInUserId) {
      return res.status(200).json({
        status: 'success',
        message: 'User details fetched successfully',
        data: {
          userId: user.userId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
        }
      });
    }

    // Fetch organizations the logged-in user belongs to or has created
    const organizations = await UserOrganisation.findAll({
      where: { userId: loggedInUserId },
      attributes: ['orgId'],
      raw: true,
    });

    const createdOrganizations = await Organisation.findAll({
      where: { userId: loggedInUserId },
      attributes: ['orgId'],
      raw: true,
    });

    const organizationIds = [
      ...new Set([
        ...organizations.map(org => org.orgId),
        ...createdOrganizations.map(org => org.orgId)
      ])
    ];

    const userInSameOrganization = await UserOrganisation.findOne({
      where: {
        userId: user.userId,
        orgId: organizationIds,
      },
      raw: true,
    });

    if (userInSameOrganization) {
      return res.status(200).json({
        status: 'success',
        message: 'User details fetched successfully',
        data: {
          userId: user.userId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
        }
      });
    } else {
      return res.status(403).json({ status: 'Bad request', message: 'Unauthorized', statusCode: 403 });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'Bad request', message: 'Internal server error', statusCode: 500 });
  }
};