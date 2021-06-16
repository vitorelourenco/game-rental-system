import express from 'express';
import cors from 'cors';
import pg from 'pg';

import Joi from 'joi';

const app = express();
app.use(express.json());
app.use(cors());
const { Pool } = pg;

const pgConfig = {
  user: 'bootcamp_role',
  password: 'senha_super_hiper_ultra_secreta_do_role_do_bootcamp',
  host: 'localhost',
  port: 5432,
  database: 'boardcamp'
}
const connection = new Pool(pgConfig);

// const query = connection.query("sqlquery",[])

const appPort = 4000;
app.listen(appPort, ()=>console.log("App is listening to port " + appPort));