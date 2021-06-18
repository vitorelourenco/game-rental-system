import {gameSchema} from './validationSchemas.js';
import acceptanceError from './acceptanceError.js';
import orderAndPagination from "./orderAndPagination.js";

//list all games
export async function getGames (req, res, connection){
  const queryName = (req.query.name ?? "")+"%";

  const validOrders = ["id", "name", "stockTotal", "categoryId", "pricePerDay"];
  const {orderBy, offset, limit} = orderAndPagination(req, validOrders);

  const fetchQuery = `
    SELECT 
      games.*, 
      categories.name AS "categoryName"
    FROM games
    JOIN categories ON categories.id = games."categoryId"
    WHERE
      games.name ILIKE $1
    ORDER BY ${orderBy}
    OFFSET $2 ROWS
    LIMIT $3
  ;`;

  try {
    const dbGames = await connection.query(fetchQuery, [queryName, offset, limit]);
    const games = dbGames.rows;
    res.status(200).send(games)
  } catch(e) {
    console.log(e);
    res.sendStatus(500);
    return;
  }
};

//insert a new game
export async function postGame (req, res, connection){
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
    res.sendStatus(201);
  } catch(e) {
    console.log(e);
    res.sendStatus(500);
    return;
  }
};