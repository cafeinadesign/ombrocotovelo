const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });
const fs = require("fs");
const pagarme = require("pagarme");

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.pagar = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    // res.statusCode = 200;
    // res.json(req.body.card_hash);
    // Grab the text parameter.
    const api_key = "ak_test_sa0HkaFNDhDNAOudGzmEvZHZ7G6L0U";
    // const api_key = "ak_live_QYD89scaEFGgzzpJdCTFX2yr4SSoL7";
    var amount = 20000;
    switch (req.body.installments) {
      case "1":
        amount = 20000;
        break;
    }
    let transaction = {
      amount: amount,
      card_hash: req.body.CARD_HASH,
      card_expiration_date: req.body.card_expiration_date,
      card_holder_name: req.body.card_holder_name,
      installments: req.body.installments,
      customer: {
        external_id: req.body.customer.external_id,
        name: req.body.customer.name,
        type: "individual",
        country: "br",
        email: req.body.customer.email,
        documents: [
          {
            type: "cpf",
            number: req.body.customer.documents[0].number,
          },
        ],
        phone_numbers: req.body.customer.phone_numbers,
      },
      billing: {
        name: req.body.customer.name,
        address: {
          country: "br",
          state: req.body.billing.address.state,
          city: req.body.billing.address.city,
          neighborhood: req.body.billing.address.neighborhood,
          street: req.body.billing.address.street,
          street_number: req.body.billing.address.street_number,
          zipcode: req.body.billing.address.zipcode,
        },
      },
      items: [
        {
          id: req.body.installments,
          title:
            "Consulta Ortopedista Dr. Rinaldo Lucena x" + req.body.installments,
          unit_price: amount,
          quantity: 1,
          tangible: false,
        },
      ],
    };
    // campo de aniversário é opicional
    if (req.body.customer.birthday) {
      transaction.customer.birthday = req.body.customer.birthday;
    }
    if (req.body.billing.address.complementary) {
      transaction.billing.address.complementary =
        req.body.billing.address.complementary;
    }
    pagarme.client
      .connect({ api_key: api_key })
      .then((client) => {
        client.transactions
          .create(transaction)
          .then((transactions) => {
            // console.log(transactions);
            res.statusCode = 200;
            // res.setHeader("Content-Type", "text/plain");
            res.json({
              status: transactions.status,
            });
            return null;
          })
          .catch((error) => {
            console.error("Rua: ", req.body.billing.address.street);
            res.json(error);
          });
        return null;
      })
      .catch((error) => {
        // console.error("Ola mundo");
        // console.error(error);
        res.json(error);
      });
    // console.log(req.body);
  });
});
