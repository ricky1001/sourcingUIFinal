const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const PORT = process.env.PORT || 5001;
const controller = require("./controller");

const app = express();

app.use(express.static(path.join(__dirname, "views")));
app.use(express.static(__dirname + "/public"));
app.use(express.static(__dirname + "/images"));

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.set("view engine", "ejs");

app.get("/", controller.getProducts);

//Sourcing update routes --- Start 

app.post("/update-products", controller.typeAndUpdateCombined);
app.get("/typeform-data", controller.typeAndUpdateCombined)

//Sourcing update routes --- end 

app.listen(PORT);
console.log(`Magic happens on port ${PORT}`);
