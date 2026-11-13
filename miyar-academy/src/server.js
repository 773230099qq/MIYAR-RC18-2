const app = require("./app");
const { PORT } = require("./config");

app.listen(PORT, () => console.log(`MIYAR Academy server running on port ${PORT}`));
