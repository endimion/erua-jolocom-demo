const MongoClient = require("mongodb").MongoClient;

const mongoURI = process.env.MONGO
  ? process.env.MONGO
  : "mongodb+srv://root:root@cluster0.vtgm8.mongodb.net/isErasmusVerifiers?retryWrites=true&w=majority";

let db = null;
MongoClient.connect(mongoURI, function (err, client) {
  if (err) throw err;
  db = client.db("isErasmusVerifiers");
});

function getAllSPs() {
  db.collection("isErasmusVerifiers")
    .find()
    .toArray(function (err, result) {
      if (err) throw err;

      console.log(result);
    });
}

function findBySPId(spId) {
  return new Promise(function (resolve, reject) {
    // console.log(`chekcing for spid: ${spId}`)
    db.collection("isErasmusVerifiers")
      .find({ spid: spId })
      .toArray(function (err, result) {
        if (err) {
          reject(err);
        }
        console.log(result);
        resolve(result);
      });
  });
}

async function addSP(spDetails) {
  let result = [];
  return new Promise(async function (resolve, reject) {
    let matchingSP = await findBySPId(spDetails.spid);
    // console.log(`looking for a match of ${spDetails.spid}`)
    if (matchingSP.length === 0) {
      // console.log("Will add a new one")
      db.collection("isErasmusVerifiers").insertOne(
        spDetails,
        function (err, res) {
          if (err) reject(err);
          console.log("1 document inserted");
          result.push(spDetails);
          resolve(result);
        }
      );
    }
  });
}

async function registerStudentEmail(userObject) {
  let result = [];
  return new Promise(async function (resolve, reject) {
    db.collection("myID-cards-used-emails").insertOne(
      userObject,
      function (err, res) {
        if (err) reject(err);
        console.log("1 document inserted");
        result.push(userObject);
        resolve(result);
      }
    );
  });
}

function findByEmail(email) {
  return new Promise(function (resolve, reject) {
    // console.log(`chekcing for spid: ${spId}`)
    db.collection("myID-cards-used-emails")
      .find({ email: email })
      .toArray(function (err, result) {
        if (err) {
          reject(err);
        }
        console.log("matching users");
        console.log(result);
        resolve(result);
      });
  });
}

function getActiveCodes() {
  return new Promise(function (resolve, reject) {
    db.collection("gift-codes")
      .find({ used: false })
      .toArray(function (err, result) {
        if (err) {
          reject(err);
        }

        console.log(result);
        resolve(result);
      });
  });
}

function updateActiveCode(code) {
  return new Promise(function (resolve, reject) {
    try{
      db.collection("gift-codes").update(
        { code: code },
        { used: true })
          
          resolve("OK");
    }catch(err){
      reject(err)
    }
    
  });
}

exports.MongoClient = MongoClient;
exports.getAllSPs = getAllSPs;
exports.findBySPId = findBySPId;
exports.addSP = addSP;
exports.registerStudentEmail = registerStudentEmail;
exports.findByEmail = findByEmail;
exports.getActiveCodes = getActiveCodes;
exports.updateActiveCode = updateActiveCode;
