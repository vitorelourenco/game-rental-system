import { rentalSchema } from "./validationSchemas.js";
import acceptanceError from "./acceptanceError.js";
import orderAndPagination from "./orderAndPagination.js";

export async function getRentals(req, res, connection) {
  const reqCustomerId = parseInt(req.query.customerId);
  //zero returns all (fetchQuery)
  const customerId = reqCustomerId ? reqCustomerId : 0;

  const reqGameId = parseInt(req.query.gameId);
  //zero returns all (fetchQuery)
  const gameId = reqGameId ? reqGameId : 0;

  const reqStatus = req.query.status;
  //all returns all (fetchQuery)
  const status = (reqStatus === "open" || reqStatus === "closed") ? reqStatus : "all";

  //none returns all (fetchQuery)
  let startDate = 'none';
  if (req.query.startDate){
    const aDate = new Date(req.query.startDate);
    if (isNaN(aDate.getTime())){
      res.sendStatus(400);
      return;
    }
    else {
      startDate = aDate.toISOString();
    }
  }

  const validOrders = ["id", "customerId", "gameId", "rentDate", "daysRented", "returnDate", "originalPrice", "delayFee"];
  const {orderBy, offset, limit} = orderAndPagination(req, validOrders);

  const fetchQuery = `
    SELECT 
      rentals.*, 
      customers.name AS "cName",
      games.name AS "gName", 
      categories.name AS "catName", categories.id AS "catId"  
    FROM RENTALS
    JOIN customers 
      ON rentals."customerId" = customers.id
    JOIN games 
      ON rentals."gameId" = games.id
    JOIN categories 
      ON games."categoryId" = categories.id 
    WHERE 
      ($3 = 0 OR customers.id = $3)
      AND ($4 = 0 OR games.id = $4)
      AND (
        ($5 = 'all')
        OR (($5 = 'open') AND (rentals."returnDate" IS NULL))
        OR (($5 = 'closed') AND (rentals."returnDate" IS NOT NULL))
      )
      AND ($6 = 'none' OR rentals."rentDate" >= CAST($6 AS date) )
    ORDER BY ${orderBy}
    OFFSET $1 ROWS
    LIMIT $2
  ;`;

  try {
    const dbRentals = await connection.query(fetchQuery, [offset, limit, customerId, gameId, status, startDate]);
    const rentals = dbRentals.rows.map(dbRental => {
      const rental = {...dbRental};
      delete rental["gName"];
      delete rental["catId"];
      delete rental["catName"];
      delete rental["cName"];

      const customer = {};
      customer.id = dbRental.customerId;
      customer.name = dbRental.cName;
      rental.customer = customer;

      const game = {};
      game.id = dbRental.gameId;
      game.name = dbRental.gName;
      game.categoryId = dbRental.catId;
      game.categoryName = dbRental.catName;
      rental.game = game;

      return rental;
    });
    res.status(200).send(rentals);
  } catch (e) {
    console.log(e);
    if (e.status) res.sendStatus(e.status);
    res.sendStatus(500);
    return;
  }
}

export async function postRental(req, res, connection) {
  //validating frontend data
  const { error: reqError, value: rental } = rentalSchema.validate(req.body);
  if (reqError) {
    res.sendStatus(400);
    return;
  }
  const idsQuery = `
      SELECT id AS "customerId", NULL as "gameId"
      FROM customers
      UNION
      SELECT NULL AS "customerId", id AS "gameId"
      FROM games
  `;

  const dbCustomerAndGameIds = await connection.query(idsQuery);
  const customerAndGameIds = dbCustomerAndGameIds.rows;

  const isCustomer = customerAndGameIds.find(
    (elem) => elem.customerId === rental.customerId
  );
  if (!isCustomer) {
    res.sendStatus(400);
    return;
  }

  const isGame = customerAndGameIds.find(
    (elem) => elem.gameId === rental.gameId
  );
  if (!isGame) {
    res.sendStatus(400);
    return;
  }

  const dbMaxRentals = await connection.query(
    `SELECT "stockTotal" FROM games WHERE id = $1`,
    [rental.gameId]
  );
  const maxRentals = dbMaxRentals.rows[0].stockTotal;
  const dbCurrentRentals = await connection.query(
    `SELECT * FROM rentals WHERE "gameId" = $1`,
    [rental.gameId]
  );
  const currentRentals = dbCurrentRentals.rows.length;
  if (maxRentals <= currentRentals) {
    res.sendStatus(400);
    return;
  }

  const dbPricePerDay = await connection.query(
    `SELECT "pricePerDay" FROM games WHERE id = $1`,
    [rental.gameId]
  );

  rental.rentDate = new Date(Date.now()).toISOString();
  rental.originalPrice = dbPricePerDay.rows[0].pricePerDay * rental.daysRented;
  rental.returnDate = null;
  rental.delayFee = null;

  const {
    customerId,
    gameId,
    rentDate,
    daysRented,
    returnDate,
    originalPrice,
    delayFee,
  } = rental;

  const rentalParam = [
    customerId,
    gameId,
    rentDate,
    daysRented,
    returnDate,
    originalPrice,
    delayFee,
  ];

  const insertQuery = `
    INSERT INTO rentals
    ("customerId", "gameId", "rentDate", "daysRented", "returnDate", "originalPrice", "delayFee")
    VALUES ($1,$2,$3,$4,$5,$6,$7)
  `;

  await connection.query(insertQuery, rentalParam);
  res.sendStatus(201);
}

export async function returnRental(req, res, connection) {
  const reqId = req.params.id;
  const idParam = parseInt(reqId);

  let rental;
  try {
    const dbRental = await connection.query(
      `SELECT * FROM rentals WHERE id = $1`,
      [idParam]
    );
    if (dbRental.rows.length === 0) throw new acceptanceError(404);
    rental = dbRental.rows[0];
    if (rental.returnDate !== null) throw new acceptanceError(400);
  } catch (e) {
    console.log(e);
    if (e.status) res.sendStatus(e.status);
    else res.sendStatus(500);
    return;
  }

  const now = Date.now();
  const returnDate = new Date(now).toISOString();
  const d1 = new Date(rental.rentDate);
  const d2 = new Date(now);
  const miliDiff = d2 - d1;
  const dayDiff = Math.floor(miliDiff / 1000 / 60 / 60 / 24);
  const delay = dayDiff > rental.daysRented ? dayDiff - rental.daysRented : 0;
  const delayFee = delay * rental.originalPrice;

  const putQuery = `
    UPDATE rentals
    SET 
      "delayFee" = $2,
      "returnDate" = $3
    WHERE 
      id = $1
  `;

  try {
    await connection.query(putQuery, [idParam, delayFee, returnDate]);
    res.sendStatus(200);
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
}

export async function deleteRental(req, res, connection) {
  const reqId = req.params.id;
  const idParam = parseInt(reqId);

  try {
    const dbRental = await connection.query(
      `SELECT * FROM rentals WHERE id = $1`,
      [idParam]
    );
    if (dbRental.rows.length === 0) throw new acceptanceError(404);
    const rental = dbRental.rows[0];
    if (rental.returnDate !== null) throw new acceptanceError(400);
    await connection.query(`DELETE FROM rentals WHERE id = $1`, [idParam]);
    res.sendStatus(200);
  } catch (e) {
    console.log(e);
    if (e.status) res.sendStatus(e.status);
    else res.sendStatus(500);
    return;
  }
}
