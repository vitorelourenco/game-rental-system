export default function orderAndPagination(req, validOrders){
  const reqDesc = req.query.desc;
  const direction = reqDesc === "true" ? "DESC" : "ASC";

  const reqOrder = req.query.order;
  const orderBy = validOrders.includes(reqOrder) ? `"${reqOrder}" ${direction}` : "id "+direction;

  const reqOffset = req.query.offset;
  const offset = reqOffset ? reqOffset : 0;

  const reqLimit = req.query.limit;
  const limit = reqLimit ? reqLimit : null
  return {orderBy, offset, limit}
}
