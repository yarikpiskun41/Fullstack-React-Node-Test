# Fullstack-React-Node-Test

**API URL:** `http://localhost:{PORT}/api`


### API Endpoints

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
            "status": "pending"
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
        "status": "pending"
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
    "status": "pending"
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
        "status": "pending"
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





