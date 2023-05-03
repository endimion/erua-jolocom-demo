const Keycloak = require("keycloak-connect");
const compose = require("compose-middleware").compose;

// var Keycloak = require("keycloak-connect");
// var keycloak = new Keycloak({
//   store: memoryStore
// });

function KeycloakMultiRealm(config, keycloakConfigs) {
  this.keycloakPerRealm = {};
  this.getRealmName = (req) => {
    //if we are behind a reverse proxy then the realm will be the third  index of the array
    // else it will be the second

    let url = req.originalUrl;

    // for example, you could get the realmName from the path
    console.log(`the url is ${req.originalUrl}`);
    console.log(`base path ${process.env.BASE_PATH}`);
    if (process.env.BASE_PATH && url.indexOf(process.env.BASE_PATH) >= 0) {
      url = "/" + url.replace(`${process.env.BASE_PATH}/`, "");
    }
    console.log(`the url now is ${url}`);
    return url.split("/")[1];
  };
  keycloakConfigs.forEach((kConfig) => {
    this.keycloakPerRealm[kConfig.realm] = new Keycloak(config, kConfig);
  });
  // console.log(`keycloaks::`);
  // console.log(this.keycloakPerRealm);
}

KeycloakMultiRealm.prototype.middleware = function (options) {
  return (req, res, next) => {
    let realmName = this.getRealmName(req);
    // console.log(`the keycloakRealm is ${realmName}`);

    if (realmName === "SSI") {
      realmName = "erua-verifier"; //"SSI";
      console.log(`keylcoakMultiRealm.js:: ${realmName}`);
      const keycloak = this.keycloakPerRealm[realmName];
      const middleware = compose(keycloak.middleware());
      middleware(req, res, next);
    } else {
      if (realmName === "erasmus_verifier_admin") {
        console.log(`keylcoakMultiRealm.js:: ${realmName}`);
        const keycloak = this.keycloakPerRealm[realmName];
        const middleware = compose(keycloak.middleware());
        middleware(req, res, next);
      } else {
        if (realmName === "jolocom-verifier") {
          console.log(`keylcoakMultiRealm.js:: ${realmName}`);
          const keycloak = this.keycloakPerRealm[realmName];
          const middleware = compose(keycloak.middleware());
          middleware(req, res, next);
        } else {
          //if no realm exists in the path, just continue the request
          const middleware = compose();
          console.log("should just continue");
          next();
        }
        // middl  eware(req, res, next);
      }
    }
  };
};

KeycloakMultiRealm.prototype.protect = function (spec) {
  return (req, res, next) => {
    let realmName = this.getRealmName(req);
    console.log(realmName);
    let keycloak = null;
    if (realmName === "SSI") {
      keycloak = this.keycloakPerRealm[realmName];
      //keycloak.config.scope = "UAegean_Disposable_ID";
      keycloak.config.scope = "Palaemon_Service_Card";
    } else {
      keycloak = this.keycloakPerRealm[realmName];
    }

    keycloak.protect(spec)(req, res, next);
  };
};

KeycloakMultiRealm.prototype.getKeycloakForRealm = function (req) {
  const realmName = this.getRealmName(req);
  const keycloak = this.keycloakPerRealm[realmName];
  return keycloak;
};

module.exports = KeycloakMultiRealm;
