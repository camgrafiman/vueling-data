const express = require("express");
const cors = require("cors");
const fs = require("fs");
const { google } = require("googleapis");

// Solo requerido en desarrollo:
// require("dotenv").config();

const {
    getHTML,
    getListProductPage,
    dataProductsActual,
    getSingleProductData,
    createXML,
    returnXML,
} = require("./lib/scraper/scraper.js");
const { createProductJson, createCatalog, createCatalogArray } = require("./lib/utils/createProductStructure.js");
const { transporter } = require("./lib/mailer/nodemailer_functions.js");

const port = process.env.PORT || 5000;

const ftp = require("basic-ftp");
const nodeCron = require("node-cron");

/* Servidor EXPRESS */
const app = express();
app.use(cors());

app.use(express.static("tmp"));
app.use(express.static("public")); // Sirve recursos desde un directorio público,
//Ej: para acceder a la carpeta feeds en el navegador./ feeds / nombre.xml

/* ENDPOINTS: */

app.get("/", (req, res) => {
    res.send("Vueling - data - precios desde - by Manu Gallego - HMG ");
});

/* Endpoint para testar el envío de mails: */
app.get("/mailer", (req, res) => {
    let mailOptions = {
        from: process.env.OUTLOOK_USER,
        to: "al3d3sign@gmail.com",
        subject: "Nodemailer notification: CQF",
        text: "Un cuarto mail de node.js app.",
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.log(err);
            return;
        }
        console.log("Mail sent: " + info.response);
        console.log("Info:", info);
    });

    res.send("Mail ok");
});

app.get("/create-xml", async(req, res) => {
    console.log(req.query.urls);
    const urlList = req.query.urls.split(",");
    console.log(urlList);
    // Crear un catalogo a partir de un array de urls:
    const test = await createCatalog(urlList);
    // Crear un XML a partir de un Array de objeto de productos:
    const xml = await createXML(test, "catalogo");

    const client = await new ftp.Client();
    client.ftp.verbose = true;

    try {
        // Conectar al servidor FTP:
        await client.access({
            host: process.env.FTP_HOST,
            user: process.env.FTP_USER,
            password: process.env.FTP_PASS,
            port: 21,
            secure: false,
        });
        // Me muevo al directorio donde quiero poner el contenido:
        await client.ensureDir("vueling/feeds");
        // Y subo el directorio entero donde se guardan los catalogos XML:
        await client.uploadFromDir("./tmp");
        // await client.uploadFrom(xmlText + '.xml', 'feed.xml');

        console.log("FICHEROS SUBIDOS AL SERVIDOR FTP!!");
        /* Para mostrar por consola la lista de archivos dentro del servidor ftp: */
        //console.log(await client.list());
    } catch (err) {
        console.log(err);
    }
    await client.close();

    res.send(test);
});

app.get("/vueling/", async(req, res) => {
    const html = getHTML(req.landing);
});

app.get("/spreadsheets/get-urls", async(req, res) => {
    const auth = new google.auth.GoogleAuth({
        keyFile: "vueling-data-aaeef24ee6b4.json",
        scopes: "https://www.googleapis.com/auth/spreadsheets",
    });

    const SPREADSHEET_PANEL = "1wTbxtEu_dbYu-ldVZ2x3wKfhN90WuVsbZ6ES4wZ33sY";
    const SPREADSHEET_FEED = "1awO0-8M54S5d9soruRBeJWBMa1eeUKB8v29cwDmeOY4";

    // Crear la instancia del cliente para la autorización:
    const client = await auth.getClient();

    // Instancia de Google Sheets API:
    const googleSheets = google.sheets({
        version: "v4",
        auth: client,
    });

    // Coger la metadata del spreadsheet:
    const metaData = await googleSheets.spreadsheets.get({
        auth,
        // Sheet a la que vamos a apuntar para obtener la información:
        spreadsheetId: SPREADSHEET_PANEL,
    });

    // Leer filas de la hoja del spreadsheet PANEL:
    const getPanelRows = await googleSheets.spreadsheets.values.get({
        auth,
        // Sheet a la que vamos a apuntar para obtener la información:
        spreadsheetId: SPREADSHEET_PANEL,
        range: "listado_vuelos_desde!A2:A",
    });

    // Leer filas de la hoja del spreadsheet PANEL:
    const getHoja = await googleSheets.spreadsheets.values.get({
        auth,
        // Sheet a la que vamos a apuntar para obtener la información:
        spreadsheetId: SPREADSHEET_PANEL,
        range: "listado_vuelos_desde!B2:B",
    });

    // Conseguir el array de URLs:
    const panelRowsUrls = await getPanelRows.data.values.flat();

    // Conseguir el array de Quincenas:
    const panelHojas = await getHoja.data.values.flat();

    // Usar el metodo createCatalog para objetos o createCatalogArray para un array sin el nombre de los campos.
    const automaticCatalog = await createCatalogArray(panelRowsUrls, panelHojas);

    console.log("======== AUTOMATIC CATALOG VALUES: ======");
    console.log(automaticCatalog);

    // // Limpiar la tabla para evitar tener datos desactualizados:
    // await googleSheets.spreadsheets.values.clear({
    //     auth,
    //     spreadsheetId: SPREADSHEET_FEED,
    //     range: "julio_cesta_main!A2:Z",
    // });

    // // Escribir los datos en otro documento, en este caso el spreadsheet FEED:
    // await googleSheets.spreadsheets.values.append({
    //     auth,
    //     spreadsheetId: SPREADSHEET_FEED,
    //     range: "julio_cesta_main!A2:Z",
    //     valueInputOption: "RAW", // O "USER_ENTERED"
    //     resource: {
    //         values: automaticCatalog,
    //     },
    // });

    // Limpiar las tablas antes de escribir los datos:
    for (let i = 0; i < panelRowsUrls.length; i++) {
        await googleSheets.spreadsheets.values.clear({
            auth,
            spreadsheetId: SPREADSHEET_FEED,
            range: panelHojas[i].toString() + "!A2:Z",
        });
    }

    //Escribir los datos en el rango deseado
    for (let i = 0; i < panelHojas.length; i++) {
        await googleSheets.spreadsheets.values.append({
            auth,
            spreadsheetId: SPREADSHEET_FEED,
            range: panelHojas[i].toString() + "!A2:Z",
            valueInputOption: "RAW", // O "USER_ENTERED"
            resource: {
                // values: automaticCatalog,
                values: automaticCatalog[i],
            },
        });
    }

    // res.json([panelRowsUrls, panelHojas, panelRowsUrls.length, panelHojas.length]);

    res.json(automaticCatalog);
});

// app.get("/spreadsheets/get-urls-2", async(req, res) => {
//     const auth = new google.auth.GoogleAuth({
//         keyFile: "caprabo-spider-f300171d1e6f.json",
//         scopes: "https://www.googleapis.com/auth/spreadsheets",
//     });

//     const SPREADSHEET_PANEL = "1h_aaAT9uCVtHPFtrbzAY7tTjuh6y8NDpMN0KL4WPlTs";
//     const SPREADSHEET_FEED = "1m9sJlblabAHH1Nj1KYtLmA3r4uV3tgoqY_SdJ-_BOg8";

//     // Crear la instancia del cliente para la autorización:
//     const client = await auth.getClient();

//     // Instancia de Google Sheets API:
//     const googleSheets = google.sheets({
//         version: "v4",
//         auth: client,
//     });

//     // Coger la metadata del spreadsheet:
//     const metaData = await googleSheets.spreadsheets.get({
//         auth,
//         // Sheet a la que vamos a apuntar para obtener la información:
//         spreadsheetId: SPREADSHEET_PANEL,
//     });

//     // Leer filas de la hoja del spreadsheet PANEL:
//     const getPanelRows = await googleSheets.spreadsheets.values.get({
//         auth,
//         // Sheet a la que vamos a apuntar para obtener la información:
//         spreadsheetId: SPREADSHEET_PANEL,
//         range: "julio_oferta!K2:K",
//     });

//     // Leer filas de la hoja del spreadsheet PANEL:
//     const getRangoFechasRows = await googleSheets.spreadsheets.values.get({
//         auth,
//         // Sheet a la que vamos a apuntar para obtener la información:
//         spreadsheetId: SPREADSHEET_PANEL,
//         range: "julio_oferta!A2:A",
//     });

//     // Conseguir el array de URLs:
//     const panelRowsUrls = await getPanelRows.data.values.flat();

//     // Conseguir el array de Quincenas:
//     const rangoFechas = await getRangoFechasRows.data.values.flat();

//     // res.json(panelRowsUrls);

//     // Usar el metodo createCatalog para objetos o createCatalogArray para un array sin el nombre de los campos.
//     const automaticCatalog = await createCatalogArray(panelRowsUrls, rangoFechas);

//     // Limpiar la tabla para evitar tener datos desactualizados:
//     await googleSheets.spreadsheets.values.clear({
//         auth,
//         spreadsheetId: SPREADSHEET_FEED,
//         range: "julio_oferta_main!A2:Z",
//     });

//     // Escribir los datos en otro documento, en este caso el spreadsheet FEED:
//     await googleSheets.spreadsheets.values.append({
//         auth,
//         spreadsheetId: SPREADSHEET_FEED,
//         range: "julio_oferta_main!A2:Z",
//         valueInputOption: "RAW", // O "USER_ENTERED"
//         resource: {
//             values: automaticCatalog,
//         },
//     });

//     res.json(automaticCatalog);
// });

// Schedule a job to run every two minutes
//const job = nodeCron.schedule("*/2 * * * *", scrapeWorldPopulation);

// Schedule a job to run every minute:
// const job = nodeCron.schedule('*/1 * * * *', function () {
// 	console.log('CRON JOB: EVERY MINUTE FIRED!' + new Date().toLocaleString());
// });

// const jobEvery2Hours = nodeCron.schedule('0 */2 * * *', function () {
// 	console.log('CRON JOB: EVERY 2 HOURS FIRED! ' + new Date().toLocaleString());
// });

// const jobEvery12Hours = nodeCron.schedule('0 */12 * * *', function () {
// 	console.log('CRON JOB: EVERY 12 HOURS FIRED! ' + new Date().toLocaleString());
// });

/*
Runs every day at 00:00:00 AM: '00 00 00 * * *'


*/
// app.get("/url/", async(req, res) => {
//     // console.log(req.params.landing);
//     console.log(req.query.landing);
//     console.log("ejecutado.");

//     const landing = req.query.landing + "_fecha: " + new Date() + "\r\n";
//     fs.open("./public/logs/log.txt", "a+", (err, fd) => {
//         if (err) throw err;
//         fs.appendFile(fd, landing, "utf8", (err) => {
//             fs.close(fd, (err) => {
//                 if (err) throw err;
//             });
//             if (err) throw err;
//         });
//     });

//     res.json({
//         url: req.query.landing,
//         date: new Date(),
//     });
// });

app.get("/get-html", async(req, res) => {
    console.log(req.query.landing);
    console.log("get-html ejecutado.");

    const landing = req.query.landing;

    console.log(landing);

    const htmlContent = await getHTML(landing);

    console.log(htmlContent);

    // fs.open('./public/html_rawdata/' + landing.replace(/^.*\/\/[^\/]+/, '') + '.txt', 'a+', (err, fd) => {
    // 	if (err) throw err;
    // 	fs.writeFile(fd, htmlContent, 'utf8', (err) => {
    // 		fs.close(fd, (err) => {
    // 			if (err) throw err;
    // 		});
    // 		if (err) throw err;
    // 	});
    // });

    res.json({
        url: req.query.landing,
    });
});

app.listen(port, () => console.log("El servidor ha iniciado en el puerto", port));