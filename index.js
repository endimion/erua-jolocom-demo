const ngrok = require("ngrok");
var express = require("express");
var session = require("express-session");
const MemcachedStore = require("connect-memcached")(session);
const path = require("path");
var cors = require("cors");
const mustacheExpress = require("mustache-express");
// const MongoClient = require("./service/mongoServ").MongoClient;
const getAllSPs = require("./service/mongoServ").getAllSPs;
const getActiveCodes = require("./service/mongoServ").getActiveCodes;
const registerStudentEmail =
  require("./service/mongoServ").registerStudentEmail;
const findByEmail = require("./service/mongoServ").findByEmail;
const addSP = require("./service/mongoServ").addSP;
const findBySPId = require("./service/mongoServ").findBySPId;
const getUserInfo = require("./service/userInfoService").getUserInfo;
const sendVerificationOK = require("./service/mailService").sendVerificationOK;
const sendGiftCodeEmail = require("./service/mailService").sendGiftCodeEmail;
const sendRegistrationEmail =
  require("./service/mailService").sendRegistrationEmail;
const fileUpload = require("express-fileupload");
const csv = require("csv-parser");
const fs = require("fs");
const { Readable } = require("stream");
var bodyParser = require("body-parser");

// const ldapClient = require('simple-ldap-client')

const public = path.join(__dirname, `public`);
const protectedRoutes = [
  "/jolocom-verifier/verify",
  "/SSI/verify",
  "/verify",
  "/isErasmus/SSI/verify",
  "/erua-demo/jolocom-verifier/verify",
];
//"/upload", "/SSI/login","/eidas/login","/taxis/login","/test-ssi/eidas/login","/test-ssi/taxis/login"

// var sessionStore = new session.MemoryStore();

const cacheStore = new MemcachedStore({
  hosts: [
    process.env.MEMCACHED_URL
      ? process.env.MEMCACHED_URL
      : "http://127.0.0.1:11211",
  ],
  secret: "123, easy as ABC. ABC, easy as 123", // Optionally use transparent encryption for memcache session data
  ttl: process.env.TTL ? process.env.TTL : 300,
  maxExpiration: 300,
});

const memoryStore = new session.MemoryStore();

const ssiRealm = {
  realm: "SSI",
  "auth-server-url": "https://dss1.aegean.gr/auth",
  "ssl-required": "external",
  resource: "test-ssi",
  credentials: {
    secret: "5da95a22-1eb9-4026-9e5a-2367fa02f8e8",
  },
  "confidential-port": 0,
};

const isErasmusRealm = {
  realm: "erasmus_verifier_admin",
  "auth-server-url": "https://dss1.aegean.gr/auth",
  "ssl-required": "external",
  resource: "isErasmus",
  credentials: {
    secret: "e5db1308-d518-4d85-aa7d-14242a85b96a",
  },
  "confidential-port": 0,
};

// const eruaVerifier = {
//   "realm": "erua-issuer",
//   "auth-server-url": "https://dss1.aegean.gr/auth",
//   "ssl-required": "external",
//   "resource": "test-client",
//   "credentials": {
//     "secret": "95nONxNO7dMurYT7W60taql42Uiv4Z3S"
//   },
//   "confidential-port": 0
// }
const eruaVerifier = {
  "realm": "jolocom-verifier",
  "auth-server-url": "https://dss.aegean.gr/auth",
  "ssl-required": "external",
  "resource": "tester",
  "credentials": {
    "secret": "rTNn6bFvLWMl6B8kQgBzLTZtKDgFwAzr"
  },
  "confidential-port": 0
}

const KeycloakMultiRealm = require("./KeycloakMultiRealm");
const e = require("express");
const { updateActiveCode } = require("./service/mongoServ");

const keycloak = new KeycloakMultiRealm(
  { store: memoryStore }, // store: cacheStore },
  [
    // ssiRealm,
    // isErasmusRealm,
    eruaVerifier,
  ]
);

var app = express();

var originsWhitelist = ["my-awesome-sauce-app.com"];
var corsOptions = {
  origin: function (origin, callback) {
    var isWhitelisted = originsWhitelist.indexOf(origin) !== -1;
    callback(null, isWhitelisted);
  },
};

app.use(cors(corsOptions));

var sess = {
  secret: "nadal federer djoker murray",
  resave: false,
  saveUninitialized: true,
  // store: cacheStore,
  store: memoryStore,
  cookie: {
    secure: false,
    maxAge: 30000,
  },
  expires: new Date(Date.now() + 30 * 86400 * 1000),
};
app.set('trust proxy', 'loopback');
// app.set("trust proxy", true); // trust first proxy


if (app.get("env") === "production") {
  sess.cookie.secure = true; // serve secure cookies
}

app.use(fileUpload());
app.use(session(sess));
app.engine("html", mustacheExpress());
app.enable("trust proxy");
app.set("view engine", "html");
app.set("views", __dirname + "/public");
app.use(express.static(public));
app.use("/erua-demo", express.static(public));
app.use(keycloak.middleware());
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use('/erua-demo', function(req, res, next) {
  console.log(req.url)
  req.url = req.originalUrl.replace('/erua-demo', '');
  console.log(req.url)
  next();
});


// Protected Routes
app.get(protectedRoutes, keycloak.protect(), async (req, res) => {
  console.log("we accessed a protected root!");
  const base = process.env.BASE_PATH ? process.env.BASE_PATH : "";
  const spId = req.query.spId;
  const email = req.query.email;
  spDetails = {
    spId: spId,
    email: email,
    BASE_URL: base,
  };

  res.render("authenticated", spDetails);
});

app.post(
  ["/erasmus_verifier_admin/post", "/isErasmus/erasmus_verifier_admin/post"],
  keycloak.protect(),
  async (req, res) => {
    console.log("****************");
    const idToken = req.kauth.grant.access_token.content;
    if (idToken.realm_access.roles.indexOf("admin") >= 0) {
      const base = process.env.BASE_PATH ? process.env.BASE_PATH : "";

      let sampleFile;
      let uploadPath;

      console.log(req.files);
      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send("No files were uploaded.");
      }
      // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
      sampleFile = req.files.sampleFile;
      console.log(sampleFile.name);
      let results = [];
      new Readable({
        read() {
          this.push(sampleFile.data);
          this.push(null);
        },
      })
        .pipe(csv())
        .on("data", (data) => results.push(data))
        .on("end", () => {
          results.forEach(async (result) => {
            // {
            //   Timestamp: '123',
            //   Name: 'nikos',
            //   Email: 'triantafyllou@gmail.com',
            //   Address: 'asfd',
            //   'Phone number': '8798',
            //   Comments: 't'
            // }
            result.spid = result["Tax Number (AFM)"];
            let addedSPs = await addSP(result);
            let verifierURI = process.env.VERIFIER_URI
              ? process.env.VERIFIER_URI
              : "http://localhost:8188/SSI/verify?spId=";
            addedSPs.forEach((sp) => {
              // console.log(sp)
              sendRegistrationEmail(sp.Email, {
                name: sp["Service Provider Name"],
                email: sp.Email,
                link: verifierURI + sp.spid,
              });
            });
          });
        });

      res.send("FILE UPLOADED OK");
    } else {
      res.send("NOT Authorized to Access this web page");
    }
  }
);

// free for all Routes
app.get(["/", "/test-ssi/", "/erua-demo/"], (req, res) => {
  const base = process.env.BASE_PATH ? process.env.BASE_PATH : "";
  let viewObject = {};
  if (req.originalUrl.indexOf(process.env.BASE_PATH) >= 0) {
    viewObject.BASE_URL = process.env.BASE_PATH;
  } else {
    viewObject.BASE_URL = "";
  }

  res.render("home", viewObject);
});

// run the app server and tunneling service
const server = app.listen(8188, () => {
  ngrok.connect(8188).then(async (ngrokUrl) => {
    endpoint = ngrokUrl;
    console.log(`Login Service running, open at ${endpoint}`);
    // let spId = "id1";
    // sendRegistrationEmail("triantafyllou.ni@gmail.com", {name:"test service provider", email: "triantafyllou.ni@gmail.com", link:"https://dss1.aegean.gr/verifier/SSI/verify?spID="+spId})
    // getAllSPs()
  });
});
