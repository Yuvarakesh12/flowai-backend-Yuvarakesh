const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "followai.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();



app.get("/transcations" , async (request , response ) => {

    const allTransactionsQuery = `
    SELECT * FROM transactions ;
    `
   const allTransactions =  await db.all(allTransactionsQuery);
   response.send(allTransactions);

})

app.post("/transactions/", async (request, response) => {
  const transactionDetails = request.body;
  const { type, category, amount, date, description } = transactionDetails;

  // Check for undefined values
  if (!type || !category || !amount || !date || !description) {
    return response.status(400).send({ error: "All fields are required." });
  }

  const addTransactionQuery = `
    INSERT INTO transactions (type, category, amount, date, description)
    VALUES (?, ?, ?, ?, ?);`;

  try {
    const dbResponse = await db.run(addTransactionQuery, [type, category, amount, date, description]);
    const transactionId = dbResponse.lastID;
    response.status(201).send({ transactionId });
  } catch (error) {
    console.log("Error:", error); // Log the error
    response.status(500).send({ error: error.message });
  }
});

app.put("/transactions/:id", async (request, response) => {
  const { id } = request.params;
  const transactionDetails = request.body;
  const { type, category, amount, date, description } = transactionDetails;

  // Check for undefined values
  if (!type || !category || !amount || !date || !description) {
    return response.status(400).send({ error: "All fields are required." });
  }

  const updateTransactionQuery = `
    UPDATE transactions 
    SET type = ?, category = ?, amount = ?, date = ?, description = ? 
    WHERE id = ?;`;

  try {
    await db.run(updateTransactionQuery, [type, category, amount, date, description, id]);
    response.send({ message: "Transaction updated successfully." });
  } catch (error) {
    console.log("Error:", error);
    response.status(500).send({ error: error.message });
  }
});



app.delete("/transactions/:id", async (request, response) => {
  const { id } = request.params;
  const deleteTransactionQuery = `DELETE FROM transactions WHERE id = ?;`;

  try {
    const result = await db.run(deleteTransactionQuery, [id]);
    if (result.changes === 0) {
      response.status(404).send({ error: "Transaction not found." });
    } else {
      response.send({ message: "Transaction deleted successfully." });
    }
  } catch (error) {
    console.log("Error:", error);
    response.status(500).send({ error: error.message });
  }
});