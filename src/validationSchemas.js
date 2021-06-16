import joi from 'joi';

export const categorySchema = joi.object({
  name: joi.string().min(1).required()
});
