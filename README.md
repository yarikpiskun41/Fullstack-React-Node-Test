# Fullstack-React-Node-Test

**API URL:** `http://localhost:{PORT}/api`


## SETUP

Use the **.env.example** file to create a **.env** file in the same folder, and fill in the required fields.

### To local run

Fill the `.env` files using the `.env.example` templates in both the `client` and `server` folders,
then follow the steps below:


#### Client
```
npm run build # Builds the app
```
**OR**
```
npm run dev # Runs the app in development mode
```

#### Server

```
# To build and run the app
npm run build
npm run start
```
**OR**
```
# To run the app in development mode
npm run build:watch
npm run start:watch
```

### Docker Run
- Fill the `.env`, `.env.client`, `.env.db` files using the `.env.example`, `.env.client.example` and `.env.db.example` templates
- Use the Docker Compose file to start the app.

### Testing

Run `npm run test` in both the `server` and `client` folders to verify that everything is working correctly.

#### Writing Tests

Write tests in the `/tests` folder of either the `server` or `client` directories.

## API Endpoints

### AUTH ENDPOINTS

#### Sign up
- **Path:** `/auth/sign-up`
- **Method:** `POST`
- **Request Body:**
```json
{
    "username": "username",
    "password": "password"
}
```
- **Response Example:**
```json
{
  "status": "OK",
  "data": {
    "accessToken" : "Bearer token",
    "refreshToken": "token"
  }
}
```

#### Sign in
- **Path:** `/auth/sign-in`
- **Method:** `POST`
- **Request Body:**
```json
{
  "username": "username",
  "password": "password"
}
```
- **Response Example:**
```json
{
  "status": "OK",
  "data": {
    "accessToken" : "Bearer token",
    "refreshToken": "token"
  }
}
```

#### Sign out
- **Path:** `/auth/sign-out`
- **Method:** `POST`
- **Request Body:**
```json
{
  "refreshToken": "token"
}
```
- **Response Example:**
```json
{
  "status": "OK"
}
```

#### Refresh tokens
- **Path:** `/auth/refresh-token`
- **Method:** `POST`
- **Request Body:**
```json
{
  "refreshToken": "token"
}
```
- **Response Example:**
```json
{
  "status": "OK",
  "data": {
    "accessToken": "Bearer newAccessToken"
  }
}
```


### TASKS ENDPOINTS

**```"Authorization" header is needed```**

#### Get All Tasks
- **Path:** `/tasks`
- **Method:** `GET`
- **Response Example:** 
```json
{
    "status": "OK",
    "data": [
        {
            "id": 1,
            "title": "Task 1",
            "description": "Task 1 Description",
            "status": "backlog"
        },
        {
            "id": 2,
            "title": "Task 2",
            "description": "Task 2 Description",
            "status": "completed"
        }
    ]
}
```

#### Get Task By ID

- **Path:** `/tasks/:id`
- **Method:** `GET`
- **Response Example:** 
```json
{
    "status": "OK",
    "data": {
        "id": 1,
        "title": "Task 1",
        "description": "Task 1 Description",
        "status": "backlog"
    }
}
```

#### Create Task

- **Path:** `/tasks`
- **Method:** `POST`
- **Request Body:** 
```json
{
    "title": "Task 3",
    "description": "Task 3 Description",
    "status": "backlog"
}
```
- **Response Example:** 
```json
{
    "status": "OK",
    "data": {
        "id": 3,
        "title": "Task 3",
        "description": "Task 3 Description",
        "status": "backlog"
    }
}
```

#### Update Task

- **Path:** `/tasks/:id`
- **Method:** `PUT`
- **Request Body:** 
```json
{
    "title": "Task 3",
    "description": "Task 3 Description Altered",
    "status": "completed"
}
```
- **Response Example:** 
```json
{
    "status": "OK",
    "data": {
        "id": 3,
        "title": "Task 3",
        "description": "Task 3 Description",
        "status": "completed"
    }
}
```

#### Delete Task

- **Path:** `/tasks/:id`
- **Method:** `DELETE`
- **Response Example:** 
```json
{
    "status": "OK"
}
```





