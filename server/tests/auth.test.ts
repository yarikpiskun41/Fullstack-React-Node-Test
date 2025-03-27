import request = require("supertest");
import * as bcrypt from "bcrypt";
import app from "../src/server";
import {UserModel} from "../src/lib/db/models/user.model";
import {getRedisClient} from "../src/lib/redis/redis.client";

jest.mock("knex", () => {
  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    first: jest.fn(),
    findById: jest.fn(),
  };
  return jest.fn(() => mockQueryBuilder);
});

jest.mock("objection", () => {
  const actualObjection = jest.requireActual("objection");
  return {
    ...actualObjection,
    Model: class MockModel {
      static query = jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        first: jest.fn(),
        findById: jest.fn(),
      });
      static tableName = "users";
      static knex = jest.fn();
    },
  };
});

jest.mock("../src/lib/redis/redis.client", () => {
  return {
    getRedisClient: jest.fn(() => ({
      hset: jest.fn().mockResolvedValue(1),
      expire: jest.fn().mockResolvedValue(1),
      hget: jest.fn().mockResolvedValue("mocked-user-key"),
      del: jest.fn().mockResolvedValue(1),
    })),
  };
});

jest.mock("bcrypt", () => ({
  hash: jest.fn().mockResolvedValue("hashedpassword123"),
  compare: jest.fn(),

}));

jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mocked-uuid'),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mocked-jwt-token'),
}));

describe("POST /api/auth/sign-up", () => {
  let redisClient: any;

  beforeAll(() => {
    redisClient = getRedisClient();
    process.env.JWT_SECRET = 'test-secret';
  });

  beforeEach(() => {
    jest.clearAllMocks();

    const query = UserModel.query();
    (query.where as jest.Mock).mockReset();
    (query.insert as jest.Mock).mockReset();
    (query.first as jest.Mock).mockReset();
    (query.first as jest.Mock).mockReset();
    (query.findById as jest.Mock).mockReset();
  });

  it("should register a new user successfully", async () => {
    const query = UserModel.query();
    (query.where as jest.Mock).mockReturnValue({
      first: jest.fn().mockResolvedValue(null),
    });
    (query.insert as jest.Mock).mockResolvedValue({
      id: 1,
      username: "testuser",
      password: "hashedpassword123",
    });

    const res = await request(app)
      .post("/api/auth/sign-up")
      .send({username: "testuser", password: "password123"});

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("OK");
    expect(res.body.data).toEqual({
      accessToken: "Bearer mocked-jwt-token",
      refreshToken: "mocked-uuid",
    });
    expect(query.where).toHaveBeenCalledWith("username", "testuser");
    expect(query.insert).toHaveBeenCalledWith({
      username: "testuser",
      password: "hashedpassword123",
    });
  });

  it("should fail if username already exists", async () => {
    const query = UserModel.query();
    (query.where as jest.Mock).mockReturnValue({
      first: jest.fn().mockResolvedValue({id: 1, username: "testuser"}),
    });

    const res = await request(app)
      .post("/api/auth/sign-up")
      .send({username: "testuser", password: "password123"});

    expect(res.status).toBe(400);
    expect(res.body.status).toBe("Error");
    expect(res.body.message).toBe("User already exists");
    expect(query.where).toHaveBeenCalledWith("username", "testuser");
    expect(query.insert).not.toHaveBeenCalled();
  });

  it("should fail if username is too short", async () => {
    const res = await request(app)
      .post("/api/auth/sign-up")
      .send({username: "usr", password: "password123"});

    expect(res.status).toBe(400);
    expect(res.body.status).toBe("Error");
    expect(res.body.message).toBe("Username and password must be at least 4 characters long");
    expect(UserModel.query().where).not.toHaveBeenCalled();
  });

  it("should fail if password is too long", async () => {
    const longPassword = "a".repeat(129);
    const res = await request(app)
      .post("/api/auth/sign-up")
      .send({username: "testuser", password: longPassword});

    expect(res.status).toBe(400);
    expect(res.body.status).toBe("Error");
    expect(res.body.message).toBe("Username and password must be less than 128 characters long");
    expect(UserModel.query().where).not.toHaveBeenCalled();
  });

  it("should fail if username or password is missing", async () => {
    const res = await request(app)
      .post("/api/auth/sign-up")
      .send({username: "testuser"});

    expect(res.status).toBe(400);
    expect(res.body.status).toBe("Error");
    expect(res.body.message).toBe("Username and password are required");
    expect(UserModel.query().where).not.toHaveBeenCalled();
  });
});

describe("POST /api/auth/sign-in", () => {
  let redisClient: any;

  beforeAll(() => {
    redisClient = getRedisClient();
    process.env.JWT_SECRET = "test-secret";
  });

  beforeEach(() => {
    jest.clearAllMocks();

    const query = UserModel.query();
    (query.where as jest.Mock).mockReset();
    (query.insert as jest.Mock).mockReset();
    (query.first as jest.Mock).mockReset();
    (query.findById as jest.Mock).mockReset();

    (bcrypt.hash as jest.Mock).mockReset();
    (bcrypt.compare as jest.Mock).mockReset();
  });

  it("should sign in a user successfully", async () => {
    const query = UserModel.query();
    (query.where as jest.Mock).mockReturnValue({
      first: jest.fn().mockResolvedValue({
        id: 1,
        username: "testuser",
        password: "hashedpassword123",
      }),
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const res = await request(app)
      .post("/api/auth/sign-in")
      .send({username: "testuser", password: "password123"});

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("OK");
    expect(res.body.data).toEqual({
      accessToken: "Bearer mocked-jwt-token",
      refreshToken: "mocked-uuid",
    });
    expect(query.where).toHaveBeenCalledWith("username", "testuser");
    expect(bcrypt.compare).toHaveBeenCalledWith("password123", "hashedpassword123");
  });

  it("should fail if username is missing", async () => {
    const res = await request(app)
      .post("/api/auth/sign-in")
      .send({password: "password123"});

    expect(res.status).toBe(400);
    expect(res.body.status).toBe("Error");
    expect(res.body.message).toBe("Username and password are required");
    expect(UserModel.query().where).not.toHaveBeenCalled();
  });

  it("should fail if password is missing", async () => {
    const res = await request(app)
      .post("/api/auth/sign-in")
      .send({username: "testuser"});

    expect(res.status).toBe(400);
    expect(res.body.status).toBe("Error");
    expect(res.body.message).toBe("Username and password are required");
    expect(UserModel.query().where).not.toHaveBeenCalled();
  });

  it("should fail if user is not found", async () => {
    const query = UserModel.query();
    (query.where as jest.Mock).mockReturnValue({
      first: jest.fn().mockResolvedValue(null),
    });

    const res = await request(app)
      .post("/api/auth/sign-in")
      .send({username: "testuser", password: "password123"});

    expect(res.status).toBe(404);
    expect(res.body.status).toBe("Error");
    expect(res.body.message).toBe("User not found");
    expect(query.where).toHaveBeenCalledWith("username", "testuser");
    expect(bcrypt.compare).not.toHaveBeenCalled();
  });

  it("should fail if password is invalid", async () => {
    const query = UserModel.query();
    (query.where as jest.Mock).mockReturnValue({
      first: jest.fn().mockResolvedValue({
        id: 1,
        username: "testuser",
        password: "hashedpassword123",
      }),
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const res = await request(app)
      .post("/api/auth/sign-in")
      .send({username: "testuser", password: "wrongpassword"});

    expect(res.status).toBe(400);
    expect(res.body.status).toBe("Error");
    expect(res.body.message).toBe("Invalid password");
    expect(query.where).toHaveBeenCalledWith("username", "testuser");
    expect(bcrypt.compare).toHaveBeenCalledWith("wrongpassword", "hashedpassword123");
    expect(redisClient.hset).not.toHaveBeenCalled();
  });
});

describe("POST /api/auth/sign-out", () => {
  let redisClient: any;

  beforeAll(() => {
    redisClient = getRedisClient();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (redisClient.del as jest.Mock).mockReset();
  });

  it("should sign out successfully with a valid refresh token", async () => {
    (redisClient.del as jest.Mock).mockResolvedValue(1);

    const res = await request(app)
      .post("/api/auth/sign-out")
      .send({refreshToken: "mocked-uuid"});

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("OK");
  });

  it("should fail if refresh token is missing", async () => {
    const res = await request(app)
      .post("/api/auth/sign-out")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.status).toBe("Error");
    expect(res.body.message).toBe("Refresh token is required");
    expect(redisClient.del).not.toHaveBeenCalled();
  });
});

describe("POST /api/auth/refresh-token", () => {
  let redisClient: any;

  beforeAll(() => {
    redisClient = getRedisClient();
    process.env.JWT_SECRET = "test-secret";
  });

  beforeEach(() => {
    jest.clearAllMocks();

    const query = UserModel.query();
    (query.where as jest.Mock).mockReset();
    (query.insert as jest.Mock).mockReset();
    (query.first as jest.Mock).mockReset();
    (query.findById as jest.Mock).mockReset();

    (redisClient.hget as jest.Mock).mockReset();
    (redisClient.hset as jest.Mock).mockReset();
    (redisClient.expire as jest.Mock).mockReset();
  });

  it("should refresh access token successfully", async () => {
    (redisClient.hget as jest.Mock).mockResolvedValue("1");
    (UserModel.query().findById as jest.Mock).mockResolvedValue({
      id: 1,
      username: "testuser",
      password: "hashedpassword123",
    });

    const res = await request(app)
      .post("/api/auth/refresh-token")
      .send({ refreshToken: "valid-refresh-token" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("OK");
    expect(res.body.data).toEqual({
      accessToken: "Bearer mocked-jwt-token",
    });
  });

  it("should fail if refresh token is missing", async () => {
    const res = await request(app)
      .post("/api/auth/refresh-token")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.status).toBe("Error");
    expect(res.body.message).toBe("Refresh token is required");
  });

  it("should fail if refresh token is invalid", async () => {
    (redisClient.hget as jest.Mock).mockReset();
    (redisClient.hget as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .post("/api/auth/refresh-token")
      .send({ refreshToken: "invalid-refresh-token" });

    expect(res.status).toBe(404);
    expect(res.body.status).toBe("Error");
    expect(res.body.message).toBe("User not found");
  });

  it("should fail if user is not found", async () => {
    (redisClient.hget as jest.Mock).mockResolvedValue("1");
    (UserModel.query().findById as jest.Mock).mockResolvedValue(null);

    const res = await request(app)
      .post("/api/auth/refresh-token")
      .send({ refreshToken: "valid-refresh-token" });

    expect(res.status).toBe(404);
    expect(res.body.status).toBe("Error");
    expect(res.body.message).toBe("User not found");
  });
})