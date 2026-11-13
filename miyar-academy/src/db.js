const { Pool } = require("pg");
const { DATABASE_URL } = require("./config");

const pool = new Pool({ connectionString: DATABASE_URL });

let queryFn = (text, params) => pool.query(text, params);

module.exports = {
  query: (text, params) => queryFn(text, params),
  pool,
  __setPool: (p) => {
    queryFn = (text, params) => p.query(text, params);
  },
  __resetPool: () => {
    queryFn = (text, params) => pool.query(text, params);
  },
};
