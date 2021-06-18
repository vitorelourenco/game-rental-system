import express from "express";
import cors from "cors";
import connect from "./database.js";
import { getCategories, postCategory } from "./categories.js";
import { getGames, postGame } from "./games.js";
import {
  getCustomerByCPF,
  getCustomerById,
  postCustomer,
  putCustomer,
} from "./customers.js";
import {
  getRentals,
  postRental,
  returnRental,
  deleteRental
} from './rentals.js';

const app = express();
app.use(express.json());
app.use(cors());
const connection = connect();

app.get("/categories", (req, res) => getCategories(req, res, connection));
app.post("/categories", (req, res) => postCategory(req, res, connection));

app.get("/games", (req, res) => getGames(req, res, connection));
app.post("/games", (req, res) => postGame(req, res, connection));

app.get("/customers", (req, res) => getCustomerByCPF(req, res, connection));
app.get("/customers/:id", (req, res) => getCustomerById(req, res, connection));
app.post("/customers", (req, res) => postCustomer(req, res, connection));
app.put("/customers/:id", (req, res) => putCustomer(req, res, connection));

app.get("/rentals", (req,res)=>getRentals(req,res,connection));
app.post("/rentals", (req,res)=>postRental(req,res,connection));
app.post("/rentals/:id/return", (req,res)=>  returnRental(req,res,connection));
app.delete("/rentals/:id", (req,res)=>  deleteRental(req,res,connection));

const appPort = 4000;
app.listen(appPort, () => console.log("App is listening to port " + appPort));
