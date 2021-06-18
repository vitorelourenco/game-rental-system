class Metrics {
  constructor(row) {
    this.revenue = (parseInt(row.baseSum) + parseInt(row.delaySum)) || 0;
    this.rentals = parseInt(row.count);
    this.average = this.rentals === 0 ? null : parseInt(this.revenue / this.rentals);
  }
}

export async function getMetrics(req,res,connection){

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

  //none returns all (fetchQuery)
  let endDate = 'none';
  if (req.query.endDate){
    const aDate = new Date(req.query.endDate);
    if (isNaN(aDate.getTime())){
      res.sendStatus(400);
      return;
    }
    else {
      endDate = aDate.toISOString();
    }
  }


  const fetchQuery = `
    SELECT COUNT(id) as count, SUM("originalPrice") as "baseSum", SUM("delayFee") as "delaySum"
    FROM rentals
    WHERE 
      ($1 = 'none' OR rentals."rentDate" >= CAST($1 AS date) )
      AND ($2 = 'none' OR rentals."rentDate" <= CAST($2 AS date) )
  `;

  try {
    const dbMetrics = await connection.query(fetchQuery, [startDate, endDate]);
    const metrics = new Metrics(dbMetrics.rows[0]);
    res.status(200).send(metrics);
  } catch(e) {
    console.log(e);
    res.sendStatus(500);
  }
}