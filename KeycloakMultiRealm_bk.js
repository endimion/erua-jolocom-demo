const Keycloak = require("keycloak-connect");
const compose = require("compose-middleware").compose;

// var Keycloak = require("keycloak-connect");
// var keycloak = new Keycloak({
//   store: memoryStore
// });

function KeycloakMultiRealm(config, keycloakConfigs) {
  this.keycloakPerRealm = {};
  let result = null;
  this.getRealmName = (req) => {
    //if we are behind a reverse proxy then the realm will be the third  index of the array
    // else it will be the second
    let url = req.originalUrl;
    if (process.env.BASE_PATH && req.originalUrl.indexOf(process.env.BASE_PATH) >= 0) {
      // depending if this is rendered in the back end or the browser, the BASE_URL part might be missing
      // /sbchain/SSI/benefit-authenticate?session=84b8ae33-8ef4-41ca-8b10-7e810c3db5c7
      console.log(`baseURL is set. The paths for ${req.originalUrl} are` );
      console.log(url.split("/"));
      result = url.split("/")[2];
    }else{
      result = url.split("/")[1];
    }
    if (
      result === "eidas" ||
      result === "taxis"
    ) {
      return "SSI"
    }
    return result;
  };


  // keycloakConfigs.forEach((kConfig) => {
  //   //add scopes per realm
  //   if (kConfig.realm === "SSI") {
  //     config.scope = "TAXIS";
  //   }
  //   this.keycloakPerRealm[kConfig.realm] = new Keycloak(config, kConfig);
  // });

}

KeycloakMultiRealm.prototype.middleware = function (options) {
  return (req, res, next) => {
    let realmName = this.getRealmName(req);
    console.log(`the realm name was found to be ${realmName}`)

    if (
      realmName === "eidas" ||
      realmName === "taxis"  ||
      realmName === "SSI"
    ) {
      realmName = "SSI"

      const keycloak = this.keycloakPerRealm[realmName];
      console.log(keycloak);
      const middleware = compose(keycloak.middleware());
      // console.log(`KeycloakMultiRealm.js prototype.middleware. The original request url is`)
      // console.log(req.originalUrl)
      if (process.env.BASE_PATH) {
        req.originalUrl = `/${process.env.BASE_PATH}${req.originalUrl}`;
      }

      middleware(req, res, next);
    } else {
      //if no realm exists in the path, just continue the request
      const middleware = compose();
      middleware(req, res, next);
    }
  };
};

KeycloakMultiRealm.prototype.protect = function (spec) {
  return (req, res, next) => {
    const realmName = this.getRealmName(req);
    // let url = req.originalUrl;
    // console.log(
    //   `req.OriginalUrl is ${req.originalUrl}`
    // );
    console.log(`looking for realm ${realmName}`);
    const keycloak = this.keycloakPerRealm[realmName];
    if(req.originalUrl.indexOf("eidas") >=0 ){
      keycloak.config.scope= "eidas-eID"
    }
    if(req.originalUrl.indexOf("taxis") >=0 ){
      keycloak.config.scope= "TAXIS_ID"
    }
    // console.log(keycloak)
    keycloak.protect(spec)(req, res, next);
  };
};

KeycloakMultiRealm.prototype.getKeycloakForRealm = function (req) {
  const realmName = this.getRealmName(req);
  const keycloak = this.keycloakPerRealm[realmName];
  return keycloak;
};

module.exports = KeycloakMultiRealm;