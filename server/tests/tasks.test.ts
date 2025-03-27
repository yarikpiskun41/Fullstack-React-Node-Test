import request = require("supertest");
import app from "../src/server";
import {TaskModel} from "../src/lib/db/models/task.model";
import * as jwt from "jsonwebtoken";


jest.resetModules();

jest.mock("knex", () => {
  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    patch: jest.fn().mockReturnThis(),
    first: jest.fn(),
    findById: jest.fn(),
    deleteById: jest.fn(),
  };
  return jest.fn(() => mockQueryBuilder);
});

jest.mock("objection", () => {
  const actualObjection = jest.requireActual("objection");
  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    patch: jest.fn().mockReturnThis(),
    first: jest.fn(),
    findById: jest.fn(),
    deleteById: jest.fn(),
  };
  return {
    ...actualObjection,
    Model: class MockModel {
      static query = jest.fn(() => mockQueryBuilder);
      static tableName = "tasks";
      static knex = jest.fn();
    },
  };
});

jest.mock("jsonwebtoken", () => ({
  verify: jest.fn(),
  sign: jest.fn().mockReturnValue("mocked-jwt-token"),
}));

describe("Tasks Router", () => {
  const validToken = "Bearer mocked-jwt-token";
  const mockTask = {id: "1", title: "Test Task", description: "Test Desc", status: "pending"};

  beforeAll(() => {
    process.env.JWT_SECRET = "test-secret";
  });

  beforeEach(() => {
    jest.clearAllMocks();

    (TaskModel.query as jest.Mock).mockReset();
    (TaskModel.query as jest.Mock).mockImplementation(() => ({
      where: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      patch: jest.fn().mockReturnThis(),
      first: jest.fn(),
      findById: jest.fn(),
      deleteById: jest.fn(),
    }));

    (jwt.verify as jest.Mock).mockImplementation((token, secret, callback) => {
      if (token === "mocked-jwt-token") {
        callback(null, {id: "1", username: "testuser"});
      } else {
        callback(new Error("Invalid token"), null);
      }
    });
  });

  describe("Middleware", ()=>{
    const validToken = "Bearer mocked-jwt-token";
    const mockTask = { id: "1", title: "Test Task", description: "Test Desc", status: "pending" };

    beforeAll(() => {
      process.env.JWT_SECRET = "test-secret";
    });

    beforeEach(() => {
      jest.clearAllMocks();

      (TaskModel.query as jest.Mock).mockReset();
      (TaskModel.query as jest.Mock).mockImplementation(() => ({
        where: jest.fn().mockReturnThis(),
        insert: jest.fn(),
        patch: jest.fn().mockReturnThis(),
        first: jest.fn(),
        findById: jest.fn((id: string) => mockTask),
        deleteById: jest.fn().mockResolvedValue(1),
      }));

      (jwt.verify as jest.Mock).mockImplementation((token, secret, callback) => {
        if (token === "mocked-jwt-token" && secret === "test-secret") {
          callback(null, { id: "1", username: "testuser" });
        } else {
          callback(new Error("Invalid token"), null);
        }
      });
    });

    it("should allow request with valid token", async () => {
      const res = await request(app)
        .get("/api/tasks")
        .set("Authorization", validToken);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("OK");
      expect(jwt.verify).toHaveBeenCalledWith(
        "mocked-jwt-token",
        "test-secret",
        expect.any(Function)
      );
    });

    it("should reject request with no token", async () => {
      const res = await request(app)
        .get("/api/tasks")
      ;

      expect(res.status).toBe(400);
      expect(jwt.verify).not.toHaveBeenCalled();
    });

    it("should reject request with wrong format token", async () => {
      const res = await request(app)
        .get("/api/tasks")
        .set("Authorization", "mocked-jwt-token");


      expect(res.status).toBe(400);
      expect(jwt.verify).not.toHaveBeenCalled();
    });

    it("should reject request with invalid token", async () => {
      (jwt.verify as jest.Mock).mockImplementation((token, secret, callback) => {
        callback(new Error("Invalid token"), null);
      });

      const res = await request(app)
        .get("/api/tasks")
        .set("Authorization", "Bearer invalid-token");

      expect(res.status).toBe(401);
      expect(jwt.verify).toHaveBeenCalledWith(
        "invalid-token",
        "test-secret",
        expect.any(Function)
      );
    });
  })
  describe("GET /api/tasks", () => {
    it("should get all tasks", async () => {
      (TaskModel.query as jest.Mock).mockResolvedValue([mockTask]);

      const res = await request(app)
        .get("/api/tasks")
        .set("Authorization", validToken);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("OK");
      expect(res.body.data).toEqual([mockTask]);
      expect(TaskModel.query).toHaveBeenCalled();
    });

    it("should get a single task by id", async () => {
      (TaskModel.query as jest.Mock).mockImplementation(() => {
        const queryBuilder = {
          where: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          patch: jest.fn().mockReturnThis(),
          first: jest.fn().mockResolvedValue(mockTask),
          findById: jest.fn(),
          deleteById: jest.fn(),
        };
        return queryBuilder;
      });

      const res = await request(app)
        .get("/api/tasks/1")
        .set("Authorization", validToken);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("OK");
      expect(res.body.data).toEqual(mockTask);
    });
  });
  describe("POST /api/tasks", () => {
    it("should add a new task", async () => {
      (TaskModel.query as jest.Mock).mockImplementation(() => ({
        where: jest.fn().mockReturnThis(),
        insert: jest.fn().mockResolvedValue(mockTask),
        patch: jest.fn().mockReturnThis(),
        first: jest.fn(),
        findById: jest.fn(),
        deleteById: jest.fn(),
      }));

      const res = await request(app)
        .post("/api/tasks")
        .set("Authorization", validToken)
        .send({ title: "Test Task", description: "Test Desc", status: "pending" });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("OK");
      expect(res.body.data).toEqual(mockTask);
    });
  });
  describe("PUT /api/tasks/:id", () => {
    it("should update a task", async () => {
      let callCount = 0;
      (TaskModel.query as jest.Mock).mockImplementation(() => ({
        where: jest.fn().mockReturnThis(),
        insert: jest.fn(),
        patch: jest.fn().mockReturnThis(),
        first: jest.fn(),
        findById: jest.fn((id: string) => {
          callCount++;
          return callCount === 1
            ? { patch: jest.fn().mockResolvedValue(1) }
            : mockTask;
        }),
        deleteById: jest.fn(),
      }));

      const res = await request(app)
        .put("/api/tasks/1")
        .set("Authorization", validToken)
        .send({ title: "Updated Task", description: "Updated Desc", status: "done" });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("OK");
      expect(res.body.data).toEqual(mockTask);
    });

    it("should fail if task not found", async () => {
      (TaskModel.query as jest.Mock).mockImplementation(() => ({
        where: jest.fn().mockReturnThis(),
        insert: jest.fn(),
        patch: jest.fn().mockReturnThis(),
        first: jest.fn(),
        findById: jest.fn((id: string) => ({
          patch: jest.fn().mockResolvedValue(0),
        })),
        deleteById: jest.fn(),
      }));

      const res = await request(app)
        .put("/api/tasks/1")
        .set("Authorization", validToken)
        .send({ title: "Updated Task" });

      expect(res.status).toBe(404);
      expect(res.body.status).toBe("Error");
      expect(res.body.message).toBe("Task not found");
    });
  });
  describe("DELETE /api/tasks/:id", () => {
    it("should delete a task", async () => {
      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        insert: jest.fn(),
        patch: jest.fn().mockReturnThis(),
        first: jest.fn(),
        findById: jest.fn((id: string) => mockTask),
        deleteById: jest.fn().mockResolvedValue(1),
      };
      (TaskModel.query as jest.Mock).mockReturnValue(queryBuilder);

      const res = await request(app)
        .delete("/api/tasks/1")
        .set("Authorization", validToken);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("OK");
      expect(TaskModel.query().findById).toHaveBeenCalledWith("1");
      expect(TaskModel.query().deleteById).toHaveBeenCalledWith("1");
    });

    it("should fail if task not found", async () => {
      (TaskModel.query().findById as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .delete("/api/tasks/1")
        .set("Authorization", validToken);

      expect(res.status).toBe(404);
      expect(res.body.status).toBe("Error");
      expect(res.body.message).toBe("Task not found");
      expect(TaskModel.query().deleteById).not.toHaveBeenCalled();
    });
  });
});