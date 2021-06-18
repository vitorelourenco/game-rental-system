import {categorySchema} from './validationSchemas.js';
import acceptanceError from './acceptanceError.js';

//list all categories
export async function getCategories (req, res, connection){
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
};

//insert a new category
export async function postCategory (req, res, connection){
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
    if (categories.includes(category.name)) throw new acceptanceError(409);
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
};