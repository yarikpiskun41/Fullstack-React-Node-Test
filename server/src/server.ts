import express from 'express';
import 'dotenv/config'
import {postgresDatabase} from '@lib/db/psql.client';
import {tasksRouter} from "@app/routes/tasks/router";
import cors from 'cors';

const app = express();
const port = process.env.PORT;

postgresDatabase()


app.use(express.json());
app.use(cors());

app.use('/api/tasks', tasksRouter());


app.listen(port, () => {
  console.log(`STARTED ON PORT ${port}`);
})