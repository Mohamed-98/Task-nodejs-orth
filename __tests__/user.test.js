const request = require('supertest');
const app = require('../app');

let testUserId;
let authToken;

describe('User API endpoints', () => {
  beforeAll(async () => {
    // Attempt to create a test user first
    const createUserRes = await request(app)
      .post('/users')
      .send({
        name: 'Test User',
        email: 'testuser@example.com',
        password: 'testpass',
        is_superuser: true
      });

    if (createUserRes.body.message !== 'Error adding user') {
      console.log("Create User Response:", createUserRes.body);
      testUserId = createUserRes.body.id;
    } else {
      console.log("Create User Failed, possibly exists. Attempting to retrieve ID...");
      const getUserRes = await request(app).get(`/users?email=testuser@example.com`);
      testUserId = getUserRes.body.id;
    }

    const loginRes = await request(app)
      .post('/login')
      .send({
        email: 'testuser@example.com',
        password: 'testpass'
      });
    console.log("Login Response:", loginRes.body);
    authToken = loginRes.body.accessToken;
  });

  it('should fetch a list of users with pagination', async () => {
  
    const page = 1;
    const limit = 10;
  
    const res = await request(app)
      .get(`/users?page=${page}&limit=${limit}`)
      .set('Authorization', `Bearer ${authToken}`);
  
   
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBeTruthy();
    expect(res.body.data.length).toBeLessThanOrEqual(limit);
  });
  
  it('should update a user', async () => {
    const res = await request(app)
      .put(`/users/${testUserId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Updated Test User', email: 'updatedtestuser@example.com' });
    console.log("Update User Response:", res.body); 
    expect(res.statusCode).toEqual(200);
  });

  it('should delete a user', async () => {
    const res = await request(app)
      .delete(`/users/${testUserId}`)
      .set('Authorization', `Bearer ${authToken}`);
    console.log("Delete User Response:", res.body); 
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message', 'User deleted successfully');
  });

  afterAll(async () => {
    if (testUserId) {
      await request(app)
        .post(`/test/cleanupUser`) 
        .send({ userId: testUserId })
        .set('Authorization', `Bearer ${authToken}`);
    }
  });
});
