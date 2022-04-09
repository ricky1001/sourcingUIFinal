const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const PORT = process.env.PORT || 5001;
const controller = require("./controller");


// Timed Request Test

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

// test typeform route
app.get("/test-typeform", controller.testTypeForm)



//Timed Request Test to write files for request - start
const requestUrl = "https://stagingapi.twenty7tec.com/sourcing.svc?wsdl";
const soap = require("soap");
const fs = require("fs");

//Sourcing Page Load
setInterval(function(){

    soap.createClient(requestUrl, function (err, client) {
        client.RunSource(argsSourcingPageLoad, function (err, result) {
          if (err) {
            console.log("error");
          } else {
            let products = result.RunSourceResult.Results.Results;        
            addDetailsToProducts(products, argsSourcingPageLoad)

            products = JSON.stringify(products)
            console.log(products)

            fs.writeFile("staticProducts/pageLoad.json", products, "utf8", function(err){
                if(err){
                    console.log("An error occured while writing JSON Object to File.");
                    return console.log(err);
                }else{
                    console.log("JSON file has been saved.");
                }
            })
          }
        });
      });

  }, 10000000);

//First Time Buyer Page Load
setInterval(function(){
    soap.createClient(requestUrl, function (err, client) {
        client.RunSource(args, function (err, result) {
          if (err) {
            console.log(err);
          } else {
            console.log("result below")
            console.log(result)
            
            let products = result.RunSourceResult.Results.Results;        
            addDetailsToProducts(products, argsFirstTimeBuyer)

            products = JSON.stringify(products)
          

            fs.writeFile("staticProducts/firstTimeBuyer.json", products, "utf8", function(err){
                if(err){
                    console.log("An error occured while writing JSON Object to File.");
                    return console.log(err);
                }else{
                    console.log("JSON file has been saved.");
                }
            })
          }
        });
      });
  }, 100000);

  const args = {
    licenseKey: "89a6a144-2cde-46b0-b396-b1363d883fe1",
    input: {
        CompanyId: "IMOU85",
        SiteId: "USSCB2", 
        Term: 25,
        ExpectedValuation: 100000,
        LoanRequired: 75000,
        ReasonForMortgage: "Purchase",
        MortgageType: "Standard",
        PaymentMethod: "Repayment"
    }
}

  let argsSourcingPageLoad = {
    licenseKey: "89a6a144-2cde-46b0-b396-b1363d883fe1",
    input: {
      CompanyId: "IMOU85",
      SiteId: "USSCB2",
      Term: 30,
      ExpectedValuation: 150000,
      LoanRequired: 75000,
      DepositAmount: 75000,
      MortgageType: "Standard",
      PaymentMethod: "Repayment",
      MortgageClass: {
        Fixed: "No_Filter",
        Variable: "Ignore",
        Discount: "Ignore",
        Tracker: "Ignore",
        Capped: "Ignore",
        LiborLinked: "Ignore",
      },
      ReasonForMortgage: "Purchase",
      PostCode: "XI",
      NumberOfItems: 20,
      initialTermLength: '2',
      Filters: {}
    },
  };

  let argsFirstTimeBuyer = {
    licenseKey: "89a6a144-2cde-46b0-b396-b1363d883fe1",
    input: {
      CompanyId: "IMOU85",
      SiteId: "USSCB2",
      Term: 30,
      ExpectedValuation: 150000,
      LoanRequired: 135000,
      DepositAmount: 15000,
      MortgageType: "Standard",
      PaymentMethod: "Repayment",
      MortgageClass: {
        Fixed: "No_Filter",
        Variable: "Ignore",
        Discount: "Ignore",
        Tracker: "Ignore",
        Capped: "Ignore",
        LiborLinked: "Ignore",
      },
      ReasonForMortgage: "Purchase",
      PostCode: "XI",
      NumberOfItems: 20,
      initialTermLength: 2,
  
      Filters: {}
    },
  };

  const addDetailsToProducts = function(arr, obj){
    arr.forEach(function(item){
     
      item.PropertyValue = obj.input.ExpectedValuation;
      item.TotalInterestPayable = item.TrueCostFullTerm - obj.input.LoanRequired;
      item.TotalInterestPayable = parseInt(item.TotalInterestPayable.toFixed(2));
      item.LoanRequired = obj.input.LoanRequired;
      let initialRatePeriodInWholeYears = item.InitialRatePeriodMonths / 12;
      initialRatePeriodInWholeYears = initialRatePeriodInWholeYears.toFixed(0);
      item.InitialRatePeriodInWholeYears = initialRatePeriodInWholeYears;

      item.ltv = (obj.input.LoanRequired / obj.input.ExpectedValuation) * 100;
      item.ltv = item.ltv.toFixed();
    })
  }

//Timed Request Test to write files for request - end



//Listening on Port
app.listen(PORT);
console.log(`Magic happens on port ${PORT}`);
