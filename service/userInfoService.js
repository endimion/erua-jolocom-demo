
const https = require("https")


function getUserInfo(access_token){

    return   new Promise(function(resolve, reject) { 
    const keycloakURI = process.env.KEYCLOAK_URI?process.env.KEYCLOAK_URI:"dss1.aegean.gr"
    const options = {
        "method": "GET",
        "hostname": keycloakURI,
        "path": "/auth/realms/SSI/protocol/openid-connect/userinfo",
        "headers": {
          "Authorization": `Bearer ${access_token}`
        }
      };
      const req = https.request(options, function (res) {
        const chunks = [];
      
        res.on("data", function (chunk) {
          chunks.push(chunk);
        });
      
        res.on("end", function () {
          const body = Buffer.concat(chunks);
          console.log(body.toString());
          resolve(body.toString());
        });
      });
      
      req.end(); 
    })
}


exports.getUserInfo = getUserInfo