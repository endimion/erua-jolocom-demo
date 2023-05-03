"use strict";
const nodemailer = require("nodemailer");
const QRCode = require("qrcode");
const path = require("path");


// create reusable transporter object using the default SMTP transport
let transporter = nodemailer.createTransport({
  host: "smtp.office365.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: "UAegean-myIDs@i4mlabUAegean.onmicrosoft.com", // generated ethereal user
    pass: " ge'Ft;ECHk%/", // generated ethereal password
  },
  tls: {
    rejectUnauthorized: false,
  },
});

async function sendEndorsementRequestMail(
  recipientEmail,
  approveLink,
  rejectLink,
  credential
) {
  // send mail with defined transport object
  console.log(
    `sending email to ${recipientEmail} with ${approveLink} ${rejectLink} and ${credential}`
  );
  await transporter.sendMail({
    from: "smartclass@aegean.gr", // sender address
    to: recipientEmail, // list of receivers
    subject: "Verifiable Credential Endorsement Request ✔", // Subject line
    text: "This a credential Endorsement request ", // plain text body
    html: `<h3>This a credential Endorsement request </h3> 
    <div> You have been asked to verify that the following information is accurate: </div>
    
    <div style="margin-Top: 3rem"> <b>${credential} </b> </div>
    
    <div style="margin-Top: 3rem">
    Please click ${approveLink} to approve this information or ${rejectLink} to reject it, 
    </div>`,
  });
}

async function sendVerificationOK(recipientEmail) {
  var date = new Date();
  // Hours part from the timestamp
  var hours = date.getHours();
  // Minutes part from the timestamp
  var minutes = "0" + date.getMinutes();
  // Seconds part from the timestamp
  var seconds = "0" + date.getSeconds();

  // Will display time in 10:30:23 format
  var formattedTime =
    hours + ":" + minutes.substr(-2) + ":" + seconds.substr(-2);

  let info = await transporter.sendMail({
    from: "eid-apps@aegean.gr", // sender address
    to: recipientEmail, // list of receivers
    subject: "Verification Succesful ✔", // Subject line
    text: "This is an automated verification email", // plain text body
    html: `<b>This is an automated verification email</b> <br/>
    <div style="font-weight: 300;margin-top: 2rem;color: #3d49a8;"> A Student's Affiliation with UAegean was succesfully verified at your service </div>
    <div style="font-weight: 300;margin-top: 1rem;color: #3d49a8;">Verification time: ${formattedTime}</div>`, // html body
  });
}

async function sendRegistrationEmail(recipientEmail, spDetails) {
  let date = new Date();
  // Hours part from the timestamp
  let hours = date.getHours();
  // Minutes part from the timestamp
  let minutes = "0" + date.getMinutes();
  // Seconds part from the timestamp
  let seconds = "0" + date.getSeconds();

  // Will display time in 10:30:23 format
  let formattedTime =
    hours + ":" + minutes.substr(-2) + ":" + seconds.substr(-2);

  generateQR(spDetails.link).then(async (qr) => {
    let body = ` <div> 
            <p>Thank you for registering to the University of the <b>Aegean "Digital Identity Cards" Verification Service!</b> </p>
            <p style="margin-top:2rem;">In order to verify the UAegean Affiliation of a student you can use the following link: </p>
            <p>${spDetails.link}</p>
            <p> Alternatively, you can print the attached <b>QR code</b> that leads to the Verification web page </p>
            <p style="margin-top:2rem;">When a user succesfully identifies themselves as a University of the Agean affiliate you will receive a confirmation email at this address</p>
            <p>For any questions please do not hestiate to contact us at erasmus@aegean.gr </p>
   
   </div> `;

    let data = `<html>
      <div style="margin-top: 3rem;margin-left: 3rem;"> <span style="
              color: darkblue;
              font-weight: 700;
              font-size: larger;">Verify</span>
              your 
              <span style="text-color: black;color: darkblue;font-weight: 700;font-size: larger;">
              University of the Aegean Affiliation
              </span>
              by Scanning the following QR code:
        </div>
        <div>
            <img src="${qr}" alt="save this file and print it if the QR code is not visible">
        </div>
        <div style="margin-top: 1rem;margin-left: 3rem;">You will need the <b>uPort</b> app installed on your phone. Download it for free from your app store </div>
   
   </html>`;
    let buff = Buffer.from(data);
    let base64data = buff.toString("base64");

    let info = await transporter.sendMail({
      from: "eid-apps@aegean.gr", // sender address
      to: recipientEmail, // list of receivers
      subject: `Succesful Registration to "Digital Identity Cards" Verification Service ✔`, // Subject line
      // text: "Thank you", // plain text body
      html: body, // html body
      attachments: [
        {
          // utf-8 string as an attachment
          filename: "plainQR.png",
          path: qr,
        },
        {
          // encoded string as an attachment
          filename: "QR_with_message.html",
          content: base64data,
          encoding: "base64",
        },
      ],
    });
  });
}

async function generateQR(text) {
  return new Promise(async function (resolve, reject) {
    try {
      resolve(
        await QRCode.toDataURL(text, {
          errorCorrectionLevel: "H",
          width: "700",
        })
      );
    } catch (err) {
      reject(err);
    }
  });
}

async function sendGiftCodeEmail(recipientEmail, code="123") {
  let info = await transporter.sendMail({
    from: "UAegean-myIDs@i4mlabUAegean.onmicrosoft.com", // sender address
    to: recipientEmail, // list of receivers
    subject:
      "You have successfully accessed 44 Coffee Shop at Chios (online): thank you!", // Subject line
    // text: "This is an automated verification email", // plain text body
    html: `
    <div>

    <p>
      This is an automated verification email. <br/>
      Your affiliation with UAegean was successfully verified.
    </p>

    <p>
      You have successfully used yourID Card with UAegean to access the services of one of the UAegean myID Card Partner Service Providers, 
      the <a href="https://www.instagram.com/44barcoffeeshop/?hl=en">44 Coffee Shop</a> at Chios, Greece. 
    </p>

    <p>
      We hope you have enjoyed the experience of using your <b>Disposable UAegean Digital Credential</b> 
      to prove your ERASMUS status to “44 Coffee Shop”. The card you have used, guarantees the <b>absolute privacy of your personal data</b>:
      <ul>
        <li>The only thing that the use of your Card reveals to a Service Provider is the fact you are a real person and an ERASMUS+ student affiliated with UAegean.
            <b> Nothing else!</b> 
        </li>
        <li>
        In addition, yourID Card with UAegean will automatically disappear after the end of your journey with UAegean without leaving any trace of you behind. 
        </li>
      </ul> 
    </p>
    </div>

    <div>
     <p>
     We really thank you for the participation in this field experiment with the SEAL Digital Identity Credentials.
      These Credentials allow you to instantly authenticate with an <b>Online Service Provider</b> (with some help from your mobile phone), 
      or to reveal some part of your identity to a <b>physical store</b> (as you “almost” did today). 
      Whatever is the use case, you are prompted to <b>scan a QR code and instantly present the requested by the Service Provider identity attributes</b>. 
     </p>

     <p>
     In several cases, the information that will be requested from you to disclose, via yourID Card | UAegean, should be minimal. In some cases, like medical services, you will be requested to submit more personal information. In all these cases, what you disclose is in your hand, and  the process is <b>absolutely conditioned upon your consent and absolutely nothing can be shared without your explicit permission</b>. 
     </p>
     <p>
     We hope that this way of authentication/identification will prevail over current plethoric identification schemes (think about Facebook for example) which require from you to share much more about you than it is really needed (and additionally you might not be made privy to whom your information  is being shared with). On top of that, this new technology might also help us to get rid of the “old fashioned” usernames and passwords. Once and for all. 
     </p>   

      <p>
      To prove how “agnostic” your identification was, the 44 Coffee Shop could not know your email, it had to ask you to provide directly an email and a physical address (the address you want to reveal). Now, the University of the Aegean and the 44 Coffee Shop will forward to you, <b>in the address you have indicated</b>, a special gift, to express our gratitude for your participation in this experiment. 
      </p>


    </div>

    <div>
      <p>
          We wish you a happy summer (the happiness of this summer may be proportional to the Covid-19 vaccination rate…). If you want to really relax, you may think to get your towel-gift  and join us in person. <a href="https://www.youtube.com/watch?v=YwIRwK6iZw4&list=RDCMUC25dAjaFcMTMiS-Is-wUzvA">The summer in Greece is very pleasant!</a>
      </p>

      <p>
          In this case, drop us a message (email: <a href="">i4m-lab@aegean.gr</a>) and visit the <a href="https://business.facebook.com/44barcoffeeshop/">44 Coffee Store</a> for a real, super tasty <a href="https://cafetaf.gr/shop/single-estate-coffees/iced-brew-taf.html?sort=p.model&order=DESC">Taf Iced Brew Coffee!</a> 
      </p>
    </div>

    <img src="cid:logo" style="width:23rem">
    <div>
        <p>Best summer regards </p>
        <p>The SEAL project</p>
        <p>UAegean | i4m Lab</p>

    </div>

    `, // html body
    attachments: [
      {
        filename: "Logo.png",
        path: path.join(__dirname, '../') + "public/img/qrcode_email.png",
        cid: "logo", //my mistake was putting "cid:logo@cid" here!
      },
    ],
  });
}

module.exports = {
  sendVerificationOK,
  sendEndorsementRequestMail,
  sendRegistrationEmail,
  sendGiftCodeEmail,
};
