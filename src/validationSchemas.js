import joi from 'joi';

export const categorySchema = joi.object({
  name: joi.string().min(1).required()
});

export const gameSchema = joi.object({
  name: joi.string().min(1).required(),
  image: joi.string().uri().required(),
  stockTotal: joi.number().integer().min(1).required(),
  categoryId: joi.number().integer().min(1).required(),
  pricePerDay: joi.number().integer().min(1).required(),
})

export const customerSchema = joi.object({
  name: joi.string().min(1).required(),
  phone: joi.string().pattern(/^\d{10,11}$/).required(),
  cpf: joi.string().pattern(/^\d{11}$/).required(),
  birthday: joi.string().isoDate().required()
});

export const rentalSchema = joi.object({
  customerId: joi.number().integer().min(1).required(),
  gameId: joi.number().integer().min(1).required(),
  daysRented: joi.number().integer().min(1).required(),
})