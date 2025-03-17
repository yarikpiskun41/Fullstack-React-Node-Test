import express from 'express';
import 'dotenv/config'
import {postgresDatabase} from '@lib/db/psql.client';
import {tasksRouter} from "@app/routes/tasks/router";
import cors from 'cors';
import {authRouter} from "@app/routes/auth/router";
import {authMiddleware} from "@lib/utils/middlewares/auth.middleware";

const app = express();
const port = process.env.PORT || 5000;

postgresDatabase()


app.use(express.json());
app.use(cors());

app.use('/api/auth', authRouter());
app.use('/api/tasks', authMiddleware(), tasksRouter());

app.get("/health", (req, res) => {
  res.status(200).send({"status": "OK"});
})


app.listen(port, () => {
  console.log(`STARTED ON PORT ${port}`);
})