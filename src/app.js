import express from 'express';
import cors from 'cors';
import pg from 'pg';
import { categorySchema } from './validationSchemas.js';
import joi from 'joi';

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

class exception {
  constructor(code) {
    this.status = code;
  }
}

app.get("/categories", async (req,res)=>{
  const fetchQuery = `
  SELECT
    *
  FROM
    categories
  ;`

  try {
    const dbCategories = await connection.query(fetchQuery);
    const categories = dbCategories.rows;
    res.status(200).send(categories)
  } catch(e) {
    console.log(e);
    res.sendStatus(500);
    return;
}
});

app.post("/categories", async (req,res)=>{
  //validating frontend data
  const {error: reqError, value: category} = categorySchema.validate(req.body);
  if (reqError) {
    res.sendStatus(400);
    return;
  }

  //checking if category doesnt exist already
  const fetchQuery = `
    SELECT
      *
    FROM
      categories
  ;`
  try {
    const dbCategories = await connection.query(fetchQuery);
    const categories = dbCategories.rows.map(cat=>cat.name);
    if (categories.includes(category.name)) throw new exception(409);
  } catch(e) {
    console.log(e);
    if (e.status) res.sendStatus(e.status);
    else res.sendStatus(500);
    return;
  }

  //adding category
  const insertQuery = `
    INSERT
    INTO
      categories
    (name)
    VALUES
      ($1)
  ;`;
  try {
    await connection.query(insertQuery,[category.name]);
    res.sendStatus(200);
  } catch(e) {
    console.log(e);
    res.sendStatus(500);
    return;
  }
});
// const query = connection.query("sqlquery",[])

const appPort = 4000;
app.listen(appPort, ()=>console.log("App is listening to port " + appPort));