import express from 'express';
import cors from 'cors';
import pg from 'pg';
import { categorySchema, gameSchema } from './validationSchemas.js';
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

class acceptanceError {
  constructor(code) {
    this.status = code;
  }
}

//list all categories
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

//insert a new category
app.post("/categories", async (req,res)=>{
  //validating frontend data
  const {error: reqError, value: category} = categorySchema.validate(req.body);
  if (reqError) {
    res.sendStatus(400);
    return;
  }

  console.log(0)
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
    if (categories.includes(category.name)) throw new acceptanceError(409);
  } catch(e) {
    console.log(e);
    if (e.status) res.sendStatus(e.status);
    else res.sendStatus(500);
    return;
  }
  console.log(1)


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

//list all games
app.get("/games", async (req,res)=>{
  const fetchQuery = `
    SELECT
      *
    FROM
      games
  ;`;

  try {
    const dbGames = await connection.query(fetchQuery);
    const games = dbGames.rows;
    res.status(200).send(games)
  } catch(e) {
    console.log(e);
    res.sendStatus(500);
    return;
  }
});

//insert a new game
app.post("/games", async (req,res)=>{
  //validating frontend data
  const {error: reqError, value: game} = gameSchema.validate(req.body);
  if (reqError) {
    res.sendStatus(400);
    return;
  }
  //
  //checking if category exists
  const fetchCategoryIdsQuery = `
    SELECT
      *
    FROM
      categories
    WHERE
      id = $1
  ;`
  try {
    const dbCategoryIds = await connection.query(fetchCategoryIdsQuery, [game.categoryId]);
    if (dbCategoryIds.rows.length === 0) throw new acceptanceError(400);
  } catch(e) {
    console.log(e);
    if (e.status) res.sendStatus(e.status);
    else res.sendStatus(500);
    return;
  }
  //
  //checking if name is not a duplicate
  const fetchGameNames = `
    SELECT
      *
    FROM
      games
    WHERE
      name = $1
  ;`
  try {
    const dbGameNames = await connection.query(fetchGameNames, [game.name]);
    if (dbGameNames.rows.length !== 0) throw new acceptanceError(409);
  } catch(e) {
    console.log(e);
    if (e.status) res.sendStatus(e.status);
    else res.sendStatus(500);
    return;
  }
  //
  //adding a new game
  const {name,image,stockTotal,categoryId,pricePerDay} = game;
  const newGame = [name,image,stockTotal,categoryId,pricePerDay];
  const insertQuery = `
    INSERT
    INTO
      games
    (name,image,"stockTotal","categoryId","pricePerDay")
    VALUES
      ($1,$2,$3,$4,$5)
  ;`;
  try {
    await connection.query(insertQuery,newGame);
    res.sendStatus(200);
  } catch(e) {
    console.log(e);
    res.sendStatus(500);
    return;
  }
});

const appPort = 4000;
app.listen(appPort, ()=>console.log("App is listening to port " + appPort));