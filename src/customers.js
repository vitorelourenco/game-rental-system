import {customerSchema} from './validationSchemas.js';
import acceptanceError from './acceptanceError.js';

//get customers - cpf is optional
export async function getCustomerByCPF (req,res,connection){
  const cpfParam = (req.query.cpf ?? "")+"%";
  const fetchQuery = `
    SELECT *
    FROM customers
    WHERE cpf ILIKE $1
  `;
  try {
    const customers = await connection.query(fetchQuery, [cpfParam]);
    res.status(200).send(customers.rows);
  } catch(e) {
    console.log(e);
    res.sendStatus(500);
    return;
  }
};

//get customers - id is mandatory
export async function getCustomerById (req,res,connection){
  const reqId = req.params.id;
  const idParam = parseInt(reqId);
  const fetchQuery = `
    SELECT *
    FROM customers
    WHERE id = $1
  `;
  try {
    const customers = await connection.query(fetchQuery, [idParam]);
    if (customers.rows.length !== 1) throw new acceptanceError(404);
    res.status(200).send(customers.rows);
  } catch(e) {
    console.log(e);
    if (e.status) res.sendStatus(e.status);
    else res.sendStatus(500);
    return;
  }
};

//post customer 
export async function postCustomer(req,res,connection){
  //validating frontend data
  const {error: reqError, value: customer} = customerSchema.validate(req.body);
  if (reqError) {
    res.sendStatus(400);
    return;
  }

  //checking if the cpf isnt a duplicate
  const fetchQuery = `
    SELECT *
    FROM customers
    WHERE cpf = $1
  `;
  try {
    const existingCustomer = await connection.query(fetchQuery,[customer.cpf]);
    if (existingCustomer.rows.length>0) throw new acceptanceError(409);
  } catch(e) {
    console.log(e);
    if (e.status !== undefined) res.sendStatus(e.status);
    else res.sendStatus(500);
    return;
  }

  const {name, phone, cpf, birthday} = customer;
  const custemerParam = [name, phone, cpf, birthday];
  const postQuery = `
    INSERT INTO customers
    (name, phone, cpf, birthday) VALUES ($1,$2,$3,$4)
  `;
  try {
    await connection.query(postQuery,custemerParam);
    res.sendStatus(201);
  } catch(e) {
    console.log(e);
    res.sendStatus(500);
    return;
  }
};

export async function putCustomer (req,res, connection){
  //validating frontend data
  const {error: reqError, value: customer} = customerSchema.validate(req.body);
  if (reqError) {
    res.sendStatus(400);
    return;
  }

  const reqId = req.params.id;
  const id = parseInt(reqId);

  //checking if the cpf isnt a duplicate
  const fetchQuery = `
    SELECT *
    FROM customers
    WHERE cpf = $1 AND id <> $2
  `;
  try {
    const existingCustomer = await connection.query(fetchQuery,[customer.cpf, id]);
    if (existingCustomer.rows.length>0) throw new acceptanceError(409);
  } catch(e) {
    console.log(e);
    if (e.status !== undefined) res.sendStatus(e.status);
    else res.sendStatus(500);
    return;
  }

  const {name, phone, cpf, birthday} = customer;
  const custemerParam = [id, name, phone, cpf, birthday];
  const putQuery = `
    UPDATE customers
    SET 
      name = $2,
      phone = $3,
      cpf = $4,
      birthday = $5
    WHERE 
      id = $1
  `;
  try {
    await connection.query(putQuery,custemerParam);
    res.sendStatus(200);
  } catch(e) {
    console.log(e);
    res.sendStatus(500);
    return;
  }
};