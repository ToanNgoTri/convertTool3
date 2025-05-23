const express = require("express");
const app = express();
const puppeteer = require("puppeteer");
var cors = require("cors");
const bodyParer = require("body-parser");
const { MongoClient } = require("mongodb");
app.use(bodyParer.json({ limit: "50mb" }));
app.use(bodyParer.urlencoded({ limit: "50mb", extended: true }));

app.use(cors());

app.use(express.static("./public"));

const ejs = require("ejs");
app.set("view engine", "ejs");

const client = new MongoClient(
  "mongodb+srv://gusteixeira25:JPwO1gvfCAjiuXKo@lawdatabase.jnsdwt3.mongodb.net/?retryWrites=true&w=majority&appName=LawDatabase"
);

var fs = require("fs");

app.get("/abc", async (req, res) => {
  let newLawObject = [];
  var data1 = JSON.parse(
    fs.readFileSync("./public/asset/LawMachine.LawContent.json", "utf8")
  );

  // fs.readFile('./public/asset/ObjectLawPair.json',  function (err, data) {
  //   if (err) throw err;
  //   console.log('write file successfully');
  //   data2 = data
  // });

  var data2 = JSON.parse(
    fs.readFileSync("./public/asset/ObjectLawPair.json", "utf8")
  );

  console.log("data1", typeof data1);

  for (let a = 0; a < data1.length; a++) {
    let newLawRelated = {};
    newLawObject[a] = data1[a];

    for (let b = 0; b < Object.keys(data1[a].info["lawRelated"]).length; b++) {
      if (
        data2[
          Object.keys(data1[a].info["lawRelated"])
            [b].toLowerCase()
            .replace(/( và| của|,|&)/gim, "")
        ]
      ) {
        if (Object.keys(data1[a].info["lawRelated"])[b].match(/\s/)) {
          newLawRelated[Object.keys(data1[a].info["lawRelated"])[b]] =
            data2[
              Object.keys(data1[a].info["lawRelated"])
                [b].toLowerCase()
                .replace(/( và| của|,|&)/gim, "")
            ];
        } else {
          newLawRelated[
            data2[
              Object.keys(data1[a].info["lawRelated"])
                [b].toLowerCase()
                .replace(/( và| của|,|&)/gim, "")
            ]
          ] = Object.keys(data1[a].info["lawRelated"])[b];
        }
      } else if (Object.keys(data1[a].info["lawRelated"])[b].match(/Hiến pháp nước/gim)) {
        const date = new Date(data1[a].info["lawDayActive"]);

        if(date > new Date('2014-01-01')){

          newLawRelated[Object.keys(data1[a].info["lawRelated"])[b]] = '0001/HP'
        }else if(date > new Date('2014-01-07')){
          newLawRelated[Object.keys(data1[a].info["lawRelated"])[b]] = '0002/HP(2001)';
          
        }else if(date > new Date('1992-04-15')){
          newLawRelated[Object.keys(data1[a].info["lawRelated"])[b]] = '68-LCT/HĐNN8(1992)';

        }else{
        newLawRelated[Object.keys(data1[a].info["lawRelated"])[b]] = 0;

        }
      } else {
        newLawRelated[Object.keys(data1[a].info["lawRelated"])[b]] = 0;
      }
    }
    newLawObject[a].info["lawRelated"] = newLawRelated;
  }

  fs.writeFile(
    "./public/asset/newObjectLaw.json",
    JSON.stringify(newLawObject),
    function (err, data) {
      if (err) throw err;
      console.log("write file successfully");
    }
  );
});

// app.get("/cde", async (req, res) => {

//   let newLawObject = [];
// var LawContent = JSON.parse(fs.readFileSync('./public/asset/LawMachine.LawContent.json','utf8'))

//   // fs.readFile('./public/asset/ObjectLawPair.json',  function (err, data) {
//   //   if (err) throw err;
//   //   console.log('write file successfully');
//   //   data2 = data
//   // });

//   var LawSearch = JSON.parse(fs.readFileSync('./public/asset/LawMachine.LawSearch.json','utf8'))

//           for (let a = 0; a < LawContent.length; a++) {

//             for (let b = 0; b < LawSearch.length; b++) {

//             if(LawContent[a]['_id'] == LawSearch[b]['_id']){

//               LawSearch[b]['info'].lawDaySign = LawContent[a]['info']['lawDaySign']
//             }
//             }

//           }

//   fs.writeFile('./public/asset/s.json', JSON.stringify(LawSearch),  function (err, data) {
//     if (err) throw err;
//     console.log('write file successfully');
//   });

// });

async function pushLawContent(info, content, id) {
  try {
    const database = client.db("LawMachine");
    const LawContent = database.collection("LawContent");
    await LawContent.insertOne({ _id: id, info, content });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}

async function pushLawSearch(info, id, fullText) {
  try {
    const database = client.db("LawMachine");
    const LawContent = database.collection("LawSearch");
    await LawContent.insertOne({
      _id: id,
      info: {
        lawNumber: info["lawNumber"],
        lawDescription: info["lawDescription"],
        lawNameDisplay: info["lawNameDisplay"],
        lawDaySign: info["lawDaySign"],
      },
      fullText,
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}

async function pushLawSearchDescription(info, id) {
  try {
    const database = client.db("LawMachine");
    const LawContent = database.collection("LawDescription");
    await LawContent.insertOne({
      _id: id,
      info: {
        lawDescription: info["lawDescription"],
        lawNameDisplay: info["lawNameDisplay"],
        lawDaySign: info["lawDaySign"],
      },
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}


async function eachRun(url) {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(50000);

  await page.goto(url, { waitUntil: "load" });

  let source = await page.content({ waitUntil: "domcontentloaded" });

  const r = await page.evaluate(async () => {
    let bg_phantich = document.querySelectorAll(".bg_phantich"); // loại bỏ phần tử khong cần thiết
    for (let f = 0; f < bg_phantich.length; f++) {
      bg_phantich[f].remove();
    }

    let elementContent = document.querySelectorAll(
      ".noidungtracuu >.docitem-1:not(.docitem-9 ~ div), .docitem-2:not(.docitem-9 ~ div), .docitem-5:not(.docitem-9 ~ div), .docitem-11:not(.docitem-9 ~ div), .docitem-12:not(.docitem-9 ~ div)"
      // ".noidungtracuu .docitem-5"
    );
    console.log("elementContent", elementContent);

    let lawRelated = "";
    let roleSign = "";

    if (Object.keys(elementContent).length == 0) {
      elementContent = document.querySelectorAll(".noidungtracuu");
      lawRelated = "";
      roleSign = "";
    } else {
      lawRelated = document.querySelector("#chidanthaydoind >.docitem-14")
        ? document.querySelector("#chidanthaydoind >.docitem-14").innerText
        : "";
      lawRelated =
        lawRelated +
        "\n" +
        (document.querySelector("#chidanthaydoind >.docitem-15")
          ? document.querySelector("#chidanthaydoind >.docitem-15").innerText
          : "");
      lawRelated = lawRelated.replace(/\_*/g, "");
      lawRelated = lawRelated.replace(/\n+/g, "\n");

      roleSign = document.querySelector("#chidanthaydoind >.docitem-9")
        ? document.querySelector("#chidanthaydoind >.docitem-9").innerText
        : "";
      roleSign = roleSign.replace(/\u00A0/gim, " ");
      roleSign = roleSign.replace(/\n +/g, "\n");
      roleSign = roleSign.replace(/\n+/g, "\n");
    }

    console.log(elementContent[1]);

    var content = "";
    for (let a = 0; a < elementContent.length; a++) {
      // content = content + "\n" + elementContent[a] ?elementContent[a].innerText:"";
      content = content + "\n" + elementContent[a].innerText;
    }
    content = content.replace(/\n+/g, "\n");
    content = content.replace(/  /gm, " ");

    let tableInfomation = document.querySelector(".div-table")
      ? document.querySelector(".div-table").innerText
      : "";

    let lawNumber;
    let unitPublish;
    let lawKind;
    let nameSign;
    let lawDaySign;
    let lawDescription;
    lawDescription = document.querySelector(".the-document-summary")
      ? document.querySelector(".the-document-summary").innerText
      : "";

    lawDescription = lawDescription.replace(/^ */, "");
    if (tableInfomation.match(/VBHN/)) {
      lawNumber = document.querySelector(
        ".div-table tr:nth-child(1) td:nth-child(2)"
      )
        ? document.querySelector(".div-table tr:nth-child(1) td:nth-child(2)")
            .innerText
        : "";
      lawNumber = lawNumber.replace(/(^ | $)/gim, "");
      lawNumber = lawNumber.match(/^\d\//gim) ? `0${lawNumber}` : lawNumber;

      unitPublish = document.querySelector(
        ".div-table tr:nth-child(2) td:nth-child(4)"
      )
        ? document.querySelector(".div-table tr:nth-child(2) td:nth-child(4)")
            .innerText
        : "";

      lawKind = document.querySelector(
        ".div-table tr:nth-child(2) td:nth-child(2)"
      )
        ? document.querySelector(".div-table tr:nth-child(2) td:nth-child(2)")
            .innerText
        : "";

      nameSign = document.querySelector(
        ".div-table tr:nth-child(3) td:nth-child(4)"
      )
        ? document.querySelector(".div-table tr:nth-child(3) td:nth-child(4)")
            .innerText
        : "";

      lawDaySign = document.querySelector(
        ".div-table tr:nth-child(1) td:nth-child(4)"
      ).innerText;
    } else {
      lawNumber = document.querySelector(
        ".div-table tr:nth-child(2) td:nth-child(2)"
      )
        ? document.querySelector(".div-table tr:nth-child(2) td:nth-child(2)")
            .innerText
        : "";
      lawNumber = lawNumber.replace(/(^ | $)/gim, "");
      lawNumber = lawNumber.match(/^\d\//gim) ? `0${lawNumber}` : lawNumber;

      unitPublish = document.querySelector(
        ".div-table tr:nth-child(1) td:nth-child(2)"
      )
        ? document.querySelector(".div-table tr:nth-child(1) td:nth-child(2)")
            .innerText
        : "";

      lawKind = document.querySelector(
        ".div-table tr:nth-child(3) td:nth-child(2)"
      )
        ? document.querySelector(".div-table tr:nth-child(3) td:nth-child(2)")
            .innerText
        : "";

      nameSign = document.querySelector(
        ".div-table tr:nth-child(3) td:nth-child(4)"
      )
        ? document.querySelector(".div-table tr:nth-child(3) td:nth-child(4)")
            .innerText
        : "";

      lawDaySign = document.querySelector(
        ".div-table tr:nth-child(4) td:nth-child(2)"
      )
        ? document.querySelector(".div-table tr:nth-child(4) td:nth-child(2)")
            .innerText
        : "";
    }

    // roleSign = roleSign.replace(/^\n(\s)*/gim, "");
    // roleSign = roleSign.replace(/\(*đã ký[^\w]+/gim, "");
    // roleSign = roleSign.replace(/\(*đã k(ý|í)\)*/gim, "");
    // roleSign = roleSign.replace(/\n\[daky\]/gim, "");
    // roleSign = roleSign.replace(/\s*$/gim, "");
    // roleSign = roleSign.replace(/^\s*/gim, "");

    return {
      content,
      lawNumber,
      unitPublish,
      lawKind,
      nameSign,
      lawDaySign,
      lawDescription,
      lawRelated,
      roleSign,
    };

    // return {
    //   content,
    //   lawNumber:'',
    //   unitPublish:'',
    //   lawKind:'',
    //   nameSign:'',
    //   lawDaySign:'',
    //   lawDescription:'',
    //   lawRelated:'',
    //   roleSign:'',
    //   elementContent:(elementContent)
    // };
  });

  await browser.close();
  return r;
}

async function allRun(url) {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(70000);
  await page.goto(url);

  // OR the faster method that doesn't wait for images to load:
  let source = await page.content({ waitUntil: "domcontentloaded" });

  const r = await page.evaluate(async () => {
    let a = [];
    let elements = document.querySelectorAll(".doc-title");
    elements.forEach((link) => {
      a.push(link.querySelector("a").href); // In ra giá trị href của mỗi thẻ <a>
    });
    console.log("elements", elements);

    return a;
  });

  // console.log(r);

  await browser.close();
  // console.log(source.toString());
  return r;
}

app.get("/", async (req, res) => {
  res.render("index");
});

app.get("/URL", async (req, res) => {
  console.log("req.query.URL", req.query.URL);
  let content = "";
  content = await eachRun(req.query.URL);
  // console.log("content['elementContent']", (content['elementContent']) );

  //  res.render('get',{content:content['content'],UnitPublish:content['UnitPublish']})
  res.render("get", {
    content: content["content"],
    lawNumber: content["lawNumber"],
    unitPublish: content["unitPublish"],
    lawKind: content["lawKind"],
    nameSign: content["nameSign"],
    lawDaySign: content["lawDaySign"],
    lawDescription: content["lawDescription"],
    lawRelated: content["lawRelated"],
    roleSign: content["roleSign"],
  });
});

app.get(`/AllURL/:id`, async (req, res) => {
  let arrayLink = await allRun(req.query.URL);
  console.log(arrayLink[req.params.id]);

  let content = "";
  content = await eachRun(arrayLink[req.params.id]);

  res.render("get", {
    content: content["content"],
    lawNumber: content["lawNumber"],
    unitPublish: content["unitPublish"],
    lawKind: content["lawKind"],
    nameSign: content["nameSign"],
    lawDaySign: content["lawDaySign"],
    lawDescription: content["lawDescription"],
    lawRelated: content["lawRelated"],
    roleSign: content["roleSign"],
  });
});


app.post("/push", async (req, res) => {
  pushLawContent(req.body.lawInfo, req.body.dataLaw, req.body.lawNumber);
  pushLawSearch(req.body.lawInfo, req.body.lawNumber, req.body.contentText);
  pushLawSearchDescription(req.body.lawInfo, req.body.lawNumber);
  

});

app.post("/addedjsonfile", async (req, res) => {
  // var data2 = JSON.parse(
  //   fs.readFileSync("./public/asset/allLawID.json", "utf8")
  // );

  // if (!data2.includes(req.body.lawNumber)) {
  //   data2.push(req.body.lawNumber);
  // }

  // fs.writeFile(
  //   "./public/asset/allLawID.json",
  //   JSON.stringify(data2),
  //   function (err, data) {
  //     if (err) throw err;
  //     console.log("write file successfully");
  //   }
  // );

  var data3 = JSON.parse(
    fs.readFileSync("./public/asset/ObjectLawPair.json", "utf8")
  );

  if (req.body.lawInfo["lawNameDisplay"].match(/Luật/gim)) {
    data3[
      req.body.lawInfo["lawNameDisplay"]
        .toLowerCase()
        .replace(/( và| của|,|&)/gim, "")
    ] = req.body.lawNumber;
    data3[req.body.lawNumber.toLowerCase()] =
    req.body.lawNumber

    console.log(1);
  } else {
    data3[req.body.lawNumber.toLowerCase()] = req.body.lawNumber;
    console.log(2);
  }

  fs.writeFile(
    "./public/asset/ObjectLawPair.json",
    JSON.stringify(data3),
    function (err, data) {
      if (err) throw err;
      console.log("write file successfully");
    }
  );
});

app.post(`/pushconvertfulltext`, async (req, res) => {
  try {
    const database = client.db("LawMachine");
    const LawContent = database.collection("LawSearch");

    LawContent.updateOne(
      {
        _id: req.body.id,
      },
      {
        $set: {
          fullText: req.body.fulltext,
        },
      }
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
  console.log(req.body.id);
});

// app.post("/searchlaw", async (req, res) => {
//   // dành cho Detail2
//   try {
//     const database = client.db("LawMachine");
//     const LawContent = database.collection("LawContent");

//     LawContent.find({
//       $or: [
//         { _id: new RegExp(`${req.body.input}`, "i") },
//         { "info.lawDescription": new RegExp(`${req.body.input}`, "i") },
//         { "info.lawNameDisplay": new RegExp(`${req.body.input}`, "i") },
//       ],
//     })
//       .project({ info: 1 })
//       .sort({ "info.lawDaySign": -1 })
//       .toArray()
//       .then((o) => res.json(o));
//   } finally {
//     // Ensures that the client will close when you finish/error
//     // await client.close();
//   }
// });

// app.post("/searchcontent", async (req, res) => {
//   // dành cho AppNavigator

//   try {
//     const database = client.db("LawMachine");
//     const LawSearch = database.collection("LawSearch");
//     LawSearch.find({ fullText: new RegExp(`${req.body.input}`, "i") })
//       .collation({ locale: "vi" })
//       .project({ info: 1 })
//       .toArray()
//       .then((o) => res.json(o));
//   } finally {
//     // Ensures that the client will close when you finish/error
//     // await client.close();
//   }
// });

// app.post("/getonelaw", async (req, res) => {
//   // dành cho Detail5
//   let a;

//   try {
//     const database = client.db("LawMachine");
//     const LawContent = database.collection("LawContent");
//     // Query for a movie that has the title 'Back to the Future'

//     a = await LawContent.findOne({ _id: req.body.screen });
//   } finally {
//     // Ensures that the client will close when you finish/error
//     // await client.close();
//   }

//   // console.log(a);
//   res.json(a);
//   // res.write(a);
// });

// app.post("/getlastedlaws", async (req, res) => {
//   // dành cho Detail2
//   try {
//     const database = client.db("LawMachine");
//     const LawContent = database.collection("LawContent");

//     LawContent.find()
//       .limit(10)
//       .project({ info: 1 })
//       .sort({ "info.lawDaySign": -1 })
//       .toArray()
//       .then((o) => res.json(o));
//   } finally {
//     // Ensures that the client will close when you finish/error
//     // await client.close();
//   }
// });

// app.post("/stackscreen", async (req, res) => {
//   // dành cho AppNavigator

//   try {
//     const database = client.db("LawMachine");
//     const LawSearch = database.collection("LawSearch");

//     LawSearch.find({})
//       .project({ info: 1 })
//       .toArray()
//       .then((o) => res.json(o));
//   } finally {
//     // Ensures that the client will close when you finish/error
//     // await client.close();
//   }
// });

app.listen(9000, function () {
  console.log("Server is running on port " + 9000);
});
