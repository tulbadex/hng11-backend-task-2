process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const { sequelize } = require('../config/database');

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

beforeEach(async () => {
  await sequelize.sync({ force: true });
})

afterAll(async () => {
  /* await sequelize.query(`
    DO
    $func$
    BEGIN
      EXECUTE
      (SELECT 'TRUNCATE TABLE ' || string_agg(oid::regclass::text, ', ') || ' RESTART IDENTITY CASCADE'
        FROM   pg_class
        WHERE  relkind = 'r'  -- only tables
        AND    relnamespace = 'public'::regnamespace
      );
    END
    $func$;
  `); */
   await sequelize.close();
});

afterEach(async () => {
 
});

let accessToken = '';

async function registerUser() {
  const res = await request(app)
      .post('/auth/register')
      .send({
        firstName: 'John',
        lastName: 'Doe',
        email: 'johnreal.doe@example.com',
        password: 'password123',
        phone: '1234567890'
  }).expect(201).then((res) => {
    accessToken = res.body.data.accessToken;
  });
}

describe('Auth Endpoints', () => {
  it('Should Register User Successfully with Default Organisation', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        phone: '1234567890'
    });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data.user.firstName).toBe('John');
    expect(res.body.data.user.lastName).toBe('Doe');
    expect(res.body.data.user.email).toBe('john.doe@example.com');

    const accessToken = res.body.data.accessToken;
    const appRes = await request(app)
      .get('/api/organisations')
      .set('Authorization', `Bearer ${accessToken}`);
    console.log(appRes.body)
    expect(appRes.body).toHaveProperty('status', 'success');
    expect(appRes.body).toHaveProperty('message', 'Organisations fetched successfully');
    expect(appRes.body).toHaveProperty('data');
    expect(appRes.body.data.organisations[0].name).toBe("John's Organisation");

  });

  // Log the user in successfully
  it('should log in a user successfully', async () => {
    await registerUser()
    const res = await request(app)
      .post('/auth/login')
      .send({
        email: 'johnreal.doe@example.com',
        password: 'password123',
    });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status', 'success');
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('user');
    expect(res.body.data.user).toHaveProperty('userId');
    expect(res.body.data.user).toHaveProperty('firstName', 'John');
    expect(res.body.data.user).toHaveProperty('lastName', 'Doe');
    expect(res.body.data.user).toHaveProperty('email', 'johnreal.doe@example.com');
  });

  it('Should Fail If Required Fields is empty', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({
        firstName: '',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        phone: '1234567890'
    });
    expect(res.statusCode).toEqual(422);
    expect(res.body).toHaveProperty('errors');
    expect(res.body.errors).toHaveLength(1);
    expect(res.body.errors[0]).toHaveProperty('field', 'firstName');
    expect(res.body.errors[0]).toHaveProperty('message', 'firstName is not allowed to be empty');
  });

  // Fail if required fields are missing
  it('should fail registration if required fields are missing', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({
        firstName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
    });

    expect(res.statusCode).toEqual(422);
    expect(res.body).toHaveProperty('errors');
    expect(res.body.errors).toHaveLength(1);
    expect(res.body.errors[0]).toHaveProperty('field', 'lastName');
    expect(res.body.errors[0]).toHaveProperty('message', 'lastName is required');
  });

  it('Should Fail if there’s Duplicate Email', async () => {
    await registerUser()
    const res = await request(app)
      .post('/auth/register')
      .send({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'johnreal.doe@example.com', // duplicate email
        password: 'password123',
        phone: '0987654321'
      });
    expect(res.statusCode).toEqual(422);
    expect(res.body).toHaveProperty('errors');
    expect(res.body.errors[0]).toHaveProperty('message');
    expect(res.body.errors).toHaveLength(1);
    expect(res.body.errors[0]).toHaveProperty('field', 'email');
  });
  
  it('should return a valid access token', async () => {
    const registerRes = await request(app)
      .post('/auth/register')
      .send({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john1.doe@example.com',
        password: 'password123',
        phone: '1234567890',
      });
  
    const accessToken = registerRes.body.data.accessToken;
    const userId = registerRes.body.data.user.userId;
  
    const userRes = await request(app)
      .get(`/api/organisations`)
      .set('Authorization', `Bearer ${accessToken}`);
    
    expect(userRes.statusCode).toEqual(200);
    expect(userRes.body).toHaveProperty('status', 'success');
    expect(userRes.body).toHaveProperty('data');
    expect(userRes.body).toHaveProperty('message', 'Organisations fetched successfully');
  });  

  it('should protect routes with authentication', async () => {
    const res = await request(app)
      .get('/api/organisations');
  
    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('status', 'Unauthorized');
    expect(res.body).toHaveProperty('message');
  });

  it('should fetch only user\'s own organisations', async () => {
    const registerRes = await request(app)
      .post('/auth/register')
      .send({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john2.doe@example.com',
        password: 'password123',
        phone: '1234567890',
      });
  
    const accessToken = registerRes.body.data.accessToken;
  
    const createOrgRes = await request(app)
      .post('/api/organisations')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: "John's Second Organisation",
        description: 'Another organisation for testing',
      });
  
    const orgId = createOrgRes.body.data.orgId;
  
    const fetchOrgRes = await request(app)
      .get(`/api/organisations/${orgId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    console.log(JSON.stringify(fetchOrgRes.data))
  
    expect(fetchOrgRes.statusCode).toEqual(200);
    expect(fetchOrgRes.body).toHaveProperty('status', 'success');
    expect(fetchOrgRes.body).toHaveProperty('message', 'Organisation fetched successfully');
  });

  it('should create an organisation for the user', async () => {
    const registerRes = await request(app)
      .post('/auth/register')
      .send({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john3.doe@example.com',
        password: 'password123',
        phone: '1234567890',
      });
  
    const accessToken = registerRes.body.data.accessToken;
  
    const createOrgRes = await request(app)
      .post('/api/organisations')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: "John's Second Organisation",
        description: 'Another organisation for testing',
      });
  
    expect(createOrgRes.statusCode).toEqual(201);
    expect(createOrgRes.body).toHaveProperty('status', 'success');
    expect(createOrgRes.body.data).toHaveProperty('orgId');
    expect(createOrgRes.body.data).toHaveProperty('name', "John's Second Organisation");
  });
  
});
