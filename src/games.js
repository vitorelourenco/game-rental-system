import {gameSchema} from './validationSchemas.js';
import acceptanceError from './acceptanceError.js';

//list all games
export async function getGames (req, res, connection){
  const queryName = req.query.name ?? "";
  const fetchQuery = `
    SELECT
      *
    FROM
      games
    WHERE
      name ILIKE $1
  ;`;

  try {
    const dbGames = await connection.query(fetchQuery, [queryName+"%"]);
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
    res.sendStatus(200);
  } catch(e) {
    console.log(e);
    res.sendStatus(500);
    return;
  }
};