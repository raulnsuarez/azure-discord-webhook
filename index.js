const https = require("https");
const express = require("express");
const app = express();
const PORT = process.env.PORT || 5000;
const password = 'aHBbIbeUyj4JW6hc-eaMJqvT0r8JlzUBXx6R5pT6e31ZHmSL0q'

app.use(express.json()).get("/", async (req, res) => {
  res.status(400);
      res.end(`App working`);
      return;
});

app.use(express.json()).post("/", async (req, res) => {
  var whId, whToken;

  try {
    const atoken = req.get("Authorization");
    if (atoken != password){
      res.status(400);
      res.end(`No authorization`);
      return;
    }
  } catch {
    res.status(400);
    res.end(`Needed Authorization Header`);
    return;
  }

  try {
    [whId, whToken] = getWebhookParts(req.query["q"]);
  } catch {
    res.status(400);
    res.end(`Send a POST request with Discord webhook address as query parameter q.\n
For example, "/?q=https://discordapp.com/api/webhooks/728789913434980374/DIUrFtsKzpHePKP895wnIK6lSbTaBIhn6xQaaL48e9E8gP5ZEpNesTQGeLRuXvrMNRUd"
`);
    return;
  }

  var eventType, text, markdown;
  try {
    var {
      eventType,
      detailedMessage: { text },
      detailedMessage: { markdown },
    } = req.body;
  } catch {
    res.status(400);
    res.end(
      "Request body must conform to { 'message': { 'text' : <string> }, 'resource': { '_links': { 'web' : { 'href' : <string> } } } }"
    );
    return;
  }

  var discordRequest = https.request(
    {
      method: "POST",
      host: "discordapp.com",
      path: `/api/webhooks/${whId}/${whToken}`,
    },
    (discordRes) => {
      res.status(discordRes.statusCode);

      discordRes.setEncoding("utf8");
      discordRes.on("data", (chunk) => {
        console.log("Discord Response: " + chunk);
        res.write(chunk);
      });
      discordRes.on("end", () => {
        res.end();
      });
    }
  );
  discordRequest.setHeader("Content-Type", "application/json");
  var jsonform = JSON.stringify({
    content: `${markdown}`,
    embeds: [
    ],
  });
  discordRequest.write(jsonform);
  discordRequest.end();
});

app.listen(PORT, function () {
  console.log(`Discord proxy app listening on port ${PORT}!`);
});

function getWebhookParts(str) {
  var whRegex = /(\d+)\/([\w\d\W]+)\/?$/;
  var whParts = whRegex.exec(str);
  if (whParts.length !== 3) {
    throw new Error("Discord webhook address must have format of '.../<webhook id>/<webhook token>'");
  }

  return [whParts[1], whParts[2]];
}