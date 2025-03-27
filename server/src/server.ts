import express from 'express';
import 'dotenv/config'
import {tasksRouter} from "@app/routes/tasks/router";
import cors from 'cors';
import {authRouter} from "@app/routes/auth/router";
import {authMiddleware} from "@lib/utils/middlewares/auth.middleware";
import {postgresDatabase} from "@lib/db/psql.client";

const app = express();



app.use(express.json());
app.use(cors());

app.use('/api/auth', authRouter());
app.use('/api/tasks', authMiddleware(), tasksRouter());

app.get("/health", (req, res) => {
  res.status(200).send({"status": "OK"});
})




if (require.main === module) {
  postgresDatabase()
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    return console.log(`STARTED ON PORT ${port}`);
  })
}

export default app;