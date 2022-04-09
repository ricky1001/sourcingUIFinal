const requestUrl = "https://stagingapi.twenty7tec.com/sourcing.svc?wsdl";
const soap = require("soap");
const ejs = require("ejs");
var read = require("fs").readFileSync;
var join = require("path").join;
var path = join(__dirname, "views/includes/item.ejs");
const url = require("url")
var Url = require('url-parse');
const { parse } = require("path");
const { Console } = require("console");
const fs = require("fs")

let args = {
  licenseKey: "89a6a144-2cde-46b0-b396-b1363d883fe1",
  input: {
    CompanyId: "IMOU85",
    SiteId: "USSCB2",
    Term: 30,
    ExpectedValuation: 150000,
    LoanRequired: 100000,
    DepositAmount: 50000,
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

    Filters: {}
  },
};

//TestTypeformroute

exports.testTypeForm = (req, res, next) => {
  res.render("test-type-form")
}


exports.getProducts = (req, res, next) => {
  fs.readFile("staticProducts/pageLoad.json", "utf8", (err, data) => {
    if(err){
      console.log(err)
    }else{
    let products = JSON.parse(data);

    //Remove all products that are not 2 year fixed
    let newArray = [];
    products.forEach(function(item){
      if(item.InitialRatePeriodInWholeYears === "2"){
        newArray.push(item)
      }
    })

    products = newArray
    console.log("Not Calling api")
    return res.render("index", {
      products,
      args: args,
      reqObj: args.input,
      productHTML: compileEJS(products, args),
    });
    }
  });
  
};

exports.typeAndUpdateCombined = (req, res, next) => {
    console.log("Calling api")
  //Check to see the original URL and include an if statement, if the request has came from typeform or locally requesting an update to the products
  const origUrl = req.originalUrl
  let reqObj = {};
  let reqUrl = origUrl.slice(15);
  if(origUrl.includes("/typeform-data") ){
 
    //Function called below deconstructs the url and build te reqObj this will need to be added to or changed if anything changes on the typeform
   reqObj = typeformUrlDeconstructor(reqUrl, reqObj)
  }else{
    reqObj = req.body;
  }
  //If any chnages are made to the input fileds or the type form we will need to confirm that by the time the request object gets to this point that it is effectively the same regardless of the origin ie from typeform or from a request update 
    let args = {}
    args.licenseKey = "89a6a144-2cde-46b0-b396-b1363d883fe1";

    //Set the required License Keys 
    args.input = reqObj;
    console.log("args below")
    console.log(args)
  // Send the request to the api 
  soap.createClient(requestUrl, function (err, client) {
    client.RunSource(args, function (err, result) {
      if (err) {
       console.log("logging error")
        console.log(err);
      } else {
        let filteredProducts = [];
        console.log("result Below")
        console.log(result)
        //If the request is coming from the update route we will need to run thhe additional filters at the moment these will be skippped for typeform response but can be added by building the same request object base on the questions asked any questions added to the typeform will need to be built into the request object using the url deconstructor function
       if(result.RunSourceResult.Results != null){
         
        addDetailsToProducts(result.RunSourceResult.Results.Results, args)

                //Filter the response
                if(!origUrl.includes("/typeform-data") ){
                  //fees filter
                  if(args.input.noFeesCheck === true){
                
                      filteredProducts =  result.RunSourceResult.Results.Results.filter(item => item.ArrangementFee === 0 && item.BookingFee === 0)
                      }else{
                  
                      filteredProducts = result.RunSourceResult.Results.Results;
      
                      }
                     
                  //Call Function to filter the products based on the initial term length ie 2 year etc
                      filteredProducts = initialTermFilter(filteredProducts, args)
                      console.log(args.input.sortBy)

                  //Call function to sort products depending on preset filter 
                      sortProducts(args.input.sortBy, filteredProducts)

                  }else{
                  filteredProducts = result.RunSourceResult.Results.Results;
                
                  }
                //Filter the request in order to do this we need to build the user interface and the typeform to collect the same data or else we can exclude type form requests from the filtering by returning early at present the 2, 3, 5 year option is not included in the typeform example There are currently 3 additional filters that need to be applied to an update product request sortBy, initialTermLength
             
              if(origUrl.includes("/typeform-data") ){
                //If the request is coming from a url that contains typeform we will need to render the new sourcing page
                       // Check the result 
              if (filteredProducts === null) {
                //If the result is empty 
                console.log("rendering with no products")
                res.render("index", {
                  filteredProducts,
                  products: [],
                  args,
                  reqObj,
                  message: "get data successfully!",
                  noProductMessage:
                    "I am sorry there are no products available that match your criteria please change the settings and try again",
                });
              } else {
                //Adding to them request Object to match other routes
                res.render("index", {
                  products: filteredProducts,
                  filteredProducts,
                  reqObj,
                  args,
                  productHTML: compileEJS(filteredProducts,  args),
                });
              }
      
              }else{
                //If the request is coming from a url that does not contain typeform we will need to res.send a response to the fetch api
                if(filteredProducts.length > 0){
              
                    return res.status(200).json({
                      status: 200,
                      message: "get data successfully!",
                      products: compileEJS(filteredProducts, args),
                      numberOfProducts: filteredProducts.length

                      
                    });
             
                }else{
                  return res.status(200).json({
                    status: 200,
                    message: "get data successfully!",
                    numberOfProducts: filteredProducts.length,
                    noProductMessage:
      
                      `<div class="noProductMessage">
                          <div class="noProductMessageInner">
                             I am sorry there are no products available that match your criteria please change the filters above and try again!
                          </div>
                      </div>`
                  });
                }
              }
       } else{
        console.log("We Should Be Here bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb")
        if(origUrl.includes("/typeform-data") ){
          //If the request is coming from a url that contains typeform we will need to render the new sourcing page
                 // Check the result 
          res.render("index", {
            filteredProducts,
            products: [],
            args,
            reqObj,
            message: "get data successfully!",
            productHTML:
            `<div class="noProductMessage">
            <div class="noProductMessageInner">
               I am sorry there are no products available that match your criteria please change the filters above and try again!
            </div>
        </div>`
          });

        } else {
          //Adding to them request Object to match other routes
          return res.status(200).json({
            products: filteredProducts,
            args,
            reqObj,
            status: 200,
            message: "get data successfully!",
            noProductMessage:
              `<div class="noProductMessage">
                  <div class="noProductMessageInner">
                     I am sorry there are no products available that match your criteria please change the filters above and try again!
                  </div>
              </div>`
          });
        }
       }

      }
    });
  });


}

//Function to sort product depending on Monthly Repayment etc
function sortProducts(str, arr){
  if(str === "normalisedTrueCost"){
    console.log("sorting true cost")
    arr.sort((a, b) => parseFloat(a.TrueCostOverInitialPeriod) - parseFloat(b.TrueCostOverInitialPeriod))
  
  }else if(str === "initialPeriodMonthlyPayment"){
    console.log("sorting initial monthly payment ")
    arr.sort((a, b) => parseFloat(a.InitialMonthlyPayment) - parseFloat(b.InitialMonthlyPayment))
  
  }else if(str === "totalFees"){
    console.log("sorting total fees")
    arr.sort((a, b) => parseFloat(a.FeesTotal) - parseFloat(b.FeesTotal))
 
  }else if(str === "initialPeriodRate"){
    console.log("sorting initial rate")
    arr.sort((a, b) => parseFloat(a.InitialPayRate) - parseFloat(b.InitialPayRate))
  
  }else if(str === "svrPeriodRate"){
    console.log("sorting svr rate")
    arr.sort((a, b) => parseFloat(a.StandardVariableRate) - parseFloat(b.StandardVariableRate))
  
  }else if(str === "apr"){
    console.log("sorting apr")
    arr.sort((a, b) => parseFloat(a.AprLenders) - parseFloat(b.AprLenders))
  }
}


//Function to deconstruct a url from type form and build a reqObj
const typeformUrlDeconstructor = function(url, obj){
    let MortgageClass= {};
    obj = JSON.parse('{"' + decodeURI(url).replace(/&/g, '","').replace(/=/g,'":"').replace(/%2C/g, ",") + '"}');
  
    obj.DepositAmount = parseInt(obj.ExpectedValuation) - parseInt(obj.LoanRequired);
    obj.Term = parseInt(obj.Term);
    obj.ExpectedValuation = parseInt(obj.ExpectedValuation);
    obj.LoanRequired = parseInt(obj.LoanRequired);

    if(obj.PaymentMethod === "Interest Only"){
      obj.PaymentMethod = "Interest_Only"
    }
    
    if(obj.MortgageClass.includes("Fixed")){
      MortgageClass.Fixed = "No_Filter"
    }else{
      MortgageClass.Fixed = "Ignore"
    }
    
    if(obj.MortgageClass.includes("Variable")){
      MortgageClass.Variable = "No_Filter"
    }else{
      MortgageClass.Variable = "Ignore"
    }
    
    if(obj.MortgageClass.includes("Discount")){
      MortgageClass.Discount = "No_Filter"
    }else{
      MortgageClass.Discount = "Ignore"
    }
    
    if(obj.MortgageClass.includes("Tracker")){
      MortgageClass.Tracker = "No_Filter"
    }else{
      MortgageClass.Tracker = "Ignore"
    }
    MortgageClass.LiborLinked = "Ignore";
    MortgageClass.Capped = "Ignore";
  
    obj.MortgageClass = MortgageClass;
  
  
    //Setting the Mortgage Type 
      //Build the args object from the query parameters
      if(obj.MortgageType === "Buy_To_Let"){
        
        obj.MortgageType = "Buy_To_Let"
      }else if(obj.MortgageType === "Let to Buy"){
        obj.MortgageType = "Let_To_Buy"
      }else{
        obj.MortgageType = "Standard"
      }
      obj.CompanyId = "IMOU85";
      obj.SiteId = "USSCB2";

      //Setting the repayment type 
      if(obj.PaymentMethod === "Interest Only"){
        obj.PaymentMethod === "Interest_Only"
      }else {
        obj.PaymentMethod === "Repayment"
      }

      console.log("obj below")
      console.log(obj)
     
    return obj
  }

  //All Products, 2 year, 3 year, 5 year fiter
const initialTermFilter = function(arr, obj){
  
    if(arr.length > 0){
      //Filter The products before Rendering(response)
      let newArray = [];
      switch (obj.input.InitialTermLength) {
        case "2":
          arr.forEach(function (product) {
            if (product.InitialRatePeriodInWholeYears === "2") {
              newArray.push(product);
            }
          });
          break;
        case "3":
          arr.forEach(function (product) {
            if (product.InitialRatePeriodInWholeYears === "3") {
              
              newArray.push(product);
            }
          });
          break;
        case "5":
         
          arr.forEach(function (product) {
            if (product.InitialRatePeriodInWholeYears === "5") {
              newArray.push(product);
            }
          });
          break;
        case "5+":
          arr.forEach(function (product) {
            if (product.InitialRatePeriodInWholeYears === "5+") {
              newArray.push(product);
            }
          });
          break;
        case "allProducts":
          newArray = arr;
          break;

        default:
          break;
      }
     return newArray;
    } else {
     return newArray = [];
    }
}
//Function that adds additional data fields to each element of the products final array before being rendered this will make it easier to automatically write the required text on the rendered screen we are currently adding Property Value, TotalInterestPayable by subtracting and an LoanRequired field 
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

  //Function to compile a url string 
    const compileEJS = (arr = [], args = {}) => {
    const data = arr.map((pd) => ejs.compile(read(path, "utf8"))({ pd, args}));
    return data.join(" ");
  };