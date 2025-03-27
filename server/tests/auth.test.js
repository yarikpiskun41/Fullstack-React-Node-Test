"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const supertest_1 = __importDefault(require("supertest"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const server_1 = __importDefault(require("../src/server"));
globals_1.jest.mock("knex", () => {
    const mockDb = {
        mock: {
            clear: globals_1.jest.fn(),
        },
        users: {
            where: globals_1.jest.fn(),
            insert: globals_1.jest.fn().mockReturnThis(),
            returning: globals_1.jest.fn(),
        },
    };
    return globals_1.jest.fn(() => mockDb);
});
globals_1.jest.mock("ioredis", () => {
    return globals_1.jest.fn().mockImplementation(() => ({
        setex: globals_1.jest.fn(),
        get: globals_1.jest.fn(),
        del: globals_1.jest.fn(),
        flushall: globals_1.jest.fn(),
    }));
});
describe("Auth API", () => {
    const db = require("knex")();
    const redisClient = new (require("ioredis"))();
    beforeEach(() => {
        globals_1.jest.clearAllMocks();
        db.mock.clear.mockClear();
        db.users.where.mockReset();
        db.users.returning.mockReset();
        redisClient.setex.mockReset();
        redisClient.get.mockReset();
        redisClient.del.mockReset();
        redisClient.flushall.mockReset();
    });
    describe("POST /api/register", () => {
        it("should register a new user", async () => {
            db.mock({
                "users.where": () => ({ first: () => Promise.resolve(null) }),
                "users.insert.returning": () => Promise.resolve([{ id: 1, username: "testuser" }]),
            });
            const res = await (0, supertest_1.default)(server_1.default)
                .post("/api/register")
                .send({ username: "testuser", password: "password123" });
            expect(res.status).toBe(201);
            expect(res.body.data.username).toBe("testuser");
        });
        it("should fail if username is taken", async () => {
            db.mock({
                "users.where": () => ({ first: () => Promise.resolve({ username: "testuser" }) }),
            });
            const res = await (0, supertest_1.default)(server_1.default)
                .post("/api/register")
                .send({ username: "testuser", password: "password123" });
            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Username already taken");
        });
    });
    describe("POST /api/login", () => {
        it("should login a user and return tokens", async () => {
            const hashedPassword = await bcrypt_1.default.hash("password123", 10);
            db.mock({
                "users.where": () => ({
                    first: () => Promise.resolve({ id: 1, username: "testuser", password: hashedPassword }),
                }),
            });
            const res = await (0, supertest_1.default)(server_1.default)
                .post("/api/login")
                .send({ username: "testuser", password: "password123" });
            expect(res.status).toBe(200);
            expect(res.body.data).toHaveProperty("accessToken");
            expect(res.body.data).toHaveProperty("refreshToken");
        });
        it("should fail with invalid credentials", async () => {
            db.mock({
                "users.where": () => ({ first: () => Promise.resolve(null) }),
            });
            const res = await (0, supertest_1.default)(server_1.default)
                .post("/api/login")
                .send({ username: "testuser", password: "wrongpass" });
            expect(res.status).toBe(401);
            expect(res.body.message).toBe("Invalid credentials");
        });
    });
    describe("POST /api/refresh", () => {
        it("should refresh access token", async () => {
            const user = { id: 1, username: "testuser" };
            const refreshToken = "valid-refresh-token";
            redisClient.set(`refresh:${user.id}`, refreshToken);
            db.mock({
                "users.where": () => ({ first: () => Promise.resolve(user) }),
            });
            globals_1.jest.spyOn(jsonwebtoken_1.default, "verify").mockReturnValueOnce(user);
            const res = await (0, supertest_1.default)(server_1.default).post("/api/refresh").send({ refreshToken });
            expect(res.status).toBe(200);
            expect(res.body.data).toHaveProperty("accessToken");
        });
    });
    describe("POST /api/logout", () => {
        it("should logout a user", async () => {
            const user = { id: 1, username: "testuser" };
            const refreshToken = "valid-refresh-token";
            redisClient.set(`refresh:${user.id}`, refreshToken);
            globals_1.jest.spyOn(jsonwebtoken_1.default, "verify").mockReturnValueOnce(user);
            const res = await (0, supertest_1.default)(server_1.default).post("/api/logout").send({ refreshToken });
            expect(res.status).toBe(200);
            expect(res.body.message).toBe("Logged out successfully");
            expect(redisClient.get(`refresh:${user.id}`)).toBeNull();
        });
    });
});
describe("Tasks API", () => {
    const db = require("knex")();
    const redisClient = new (require("ioredis"))();
    const ACCESS_TOKEN_SECRET = "default-access-secret";
    let accessToken = "";
    beforeAll(() => {
        accessToken = jsonwebtoken_1.default.sign({ id: 1, username: "testuser" }, ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
    });
    beforeEach(() => {
        globals_1.jest.clearAllMocks();
        db.mock.clear.mockClear();
        db.tasks.where.mockReset();
        db.tasks.insert.mockReset();
        db.tasks.update.mockReset();
        db.tasks.returning.mockReset();
        db.tasks.del.mockReset();
        redisClient.flushall.mockReset();
    });
    describe("GET /api/tasks", () => {
        it("should fetch all tasks for a user", async () => {
            db.tasks.where.mockResolvedValue([{ id: "1", title: "Test Task", status: "pending", user_id: 1 }]);
            const res = await (0, supertest_1.default)(server_1.default)
                .get("/api/tasks")
                .set("Authorization", `Bearer ${accessToken}`);
            expect(res.status).toBe(200);
            expect(res.body.data[0].title).toBe("Test Task");
            expect(db.tasks.where).toHaveBeenCalledWith({ user_id: 1 });
        });
        it("should fail without token", async () => {
            const res = await (0, supertest_1.default)(server_1.default).get("/api/tasks");
            expect(res.status).toBe(401);
            expect(res.body.message).toBe("No access token provided");
        });
    });
    describe("POST /api/tasks", () => {
        it("should create a new task", async () => {
            db.tasks.returning.mockResolvedValue([{ id: "1", title: "New Task", status: "pending", user_id: 1 }]);
            const res = await (0, supertest_1.default)(server_1.default)
                .post("/api/tasks")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({ title: "New Task", status: "pending" });
            expect(res.status).toBe(200);
            expect(res.body.data.title).toBe("New Task");
            expect(db.tasks.insert).toHaveBeenCalledWith({
                title: "New Task",
                status: "pending",
                user_id: 1,
            });
        });
        it("should fail with invalid status", async () => {
            const res = await (0, supertest_1.default)(server_1.default)
                .post("/api/tasks")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({ title: "New Task", status: "invalid" });
            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Invalid status");
        });
    });
    describe("PUT /api/tasks/:id", () => {
        it("should update a task", async () => {
            db.tasks.where.mockImplementation((query) => ({
                first: () => (query.id === "1" && query.user_id === 1 ? Promise.resolve({
                    id: "1",
                    user_id: 1
                }) : Promise.resolve(null)),
            }));
            db.tasks.returning.mockResolvedValue([{ id: "1", title: "Updated Task", status: "in-progress", user_id: 1 }]);
            const res = await (0, supertest_1.default)(server_1.default)
                .put("/api/tasks/1")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({ title: "Updated Task", status: "in-progress" });
            expect(res.status).toBe(200);
            expect(res.body.data.title).toBe("Updated Task");
            expect(db.tasks.update).toHaveBeenCalledWith({ title: "Updated Task", status: "in-progress" });
        });
        it("should fail if task not found", async () => {
            db.tasks.where.mockReturnValue({ first: () => Promise.resolve(null) });
            const res = await (0, supertest_1.default)(server_1.default)
                .put("/api/tasks/1")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({ title: "Updated Task", status: "in-progress" });
            expect(res.status).toBe(404);
            expect(res.body.message).toBe("Task not found");
        });
    });
    describe("DELETE /api/tasks/:id", () => {
        it("should delete a task", async () => {
            db.tasks.where.mockImplementation((query) => ({
                first: () => (query.id === "1" && query.user_id === 1 ? Promise.resolve({
                    id: "1",
                    user_id: 1
                }) : Promise.resolve(null)),
            }));
            db.tasks.del.mockResolvedValue(1);
            const res = await (0, supertest_1.default)(server_1.default)
                .delete("/api/tasks/1")
                .set("Authorization", `Bearer ${accessToken}`);
            expect(res.status).toBe(200);
            expect(res.body.message).toBe("Task deleted");
            expect(db.tasks.del).toHaveBeenCalledWith();
        });
        it("should fail if task not found", async () => {
            db.tasks.where.mockReturnValue({ first: () => Promise.resolve(null) });
            const res = await (0, supertest_1.default)(server_1.default)
                .delete("/api/tasks/1")
                .set("Authorization", `Bearer ${accessToken}`);
            expect(res.status).toBe(404);
            expect(res.body.message).toBe("Task not found");
        });
    });
});
//# sourceMappingURL=auth.test.js.map