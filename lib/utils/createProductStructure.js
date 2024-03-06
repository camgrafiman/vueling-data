const { getHTML, getHTMLCORS, getSingleProductData, getListProductPage } = require("../scraper/scraper.js");
const { validarURL } = require("./helperFunctions.js");

async function createProductJson(jsonData) {
    // console.log(jsonData);
    try {
        let product = {
            unique_id: jsonData.productid, // product id for reporting
            reporting_label: jsonData.nombreProducto, // active_marketplace
            categoria: jsonData.quincena, // categoria
            cat_list: "A", // cat list
            product_id: jsonData.productid, // product id
            peso: "1", // peso
            disponible: true,
            por_defecto: false,
            nombre_producto: jsonData.nombreProducto, // nombre producto
            precio_actual: jsonData.precioProducto, // precio
            precio: jsonData.precioProducto, // precio
            oferta: jsonData.quincena, // oferta
            url_destino: jsonData.url, // url de destino
            ruta_imagen: jsonData.imageLink,
            extra1: "in stock", // availability
            extra2: jsonData.url, // url
            extra3: "caprabo", // product_type
        };
        return product;
    } catch (error) {
        console.log("ERROR EN CREATE PRODUCT JSON");
        console.log(error);
    }
}

async function createProductArray(jsonData) {
    // console.log(jsonData);
    try {
        let product = [
            jsonData.productid, // product id for reporting
            jsonData.nombreProducto, // active_marketplace
            jsonData.quincena, // categoria
            jsonData.quincena, // cat list
            jsonData.productid, // product id
            "1", // peso
            true,
            false,
            jsonData.nombreProducto, // nombre producto
            jsonData.precioProducto, // precio
            jsonData.precioProducto, // precio
            jsonData.quincena, // oferta
            jsonData.url, // url de destino
            jsonData.imageLink, // imagen
            jsonData.pictograma1,
            jsonData.pictograma2,
            jsonData.pictograma3,
        ];

        // Retorna un array.
        return product;
    } catch (error) {
        console.log("ERROR EN CREATE PRODUCT ARRAY");
        console.log(error);
    }
}

async function createCatalog(urlList) {
    try {
        const productDataList = [];

        for (const value of urlList) {
            let actualHTML = await getHTML(value);
            let pdp = await getSingleProductData(actualHTML, "xml", value, "SIN_DATOS");
            let pdpStructure = await createProductJson(pdp);
            productDataList.push(pdpStructure);
        }

        // console.log(productDataList);
        return await productDataList;
    } catch (error) {
        console.log(error);
    }
}

async function createCatalogArray(urlList, nombre_hoja) {
    try {
        const productDataList = [];
        var index = 0;
        for (const value of urlList) {
            console.log("value ==========");
            console.log(value);
            console.log("value ==========");
            let actualHTML = await getHTML(value);
            // Esto va a generar un array de arrays
            let listadoRutas = await getListProductPage(actualHTML, nombre_hoja[index]);
            // let objConvertidoEnArray = await Object.values(listadoRutas);
            productDataList.push(listadoRutas);

            index += 1;
        }
        // console.log(productDataList);
        // Retorno de un Array>[]Arrays>[]Arrays
        return await productDataList;
    } catch (error) {
        console.log("ERROR EN CREATE CATALOG ARRAY");
        console.log(error);
    }
}

async function createCatalogArrayCORS(urlList, nombre_hoja) {
    try {
        const productDataList = [];
        var index = 0;
        for (const value of urlList) {
            console.log("value ==========");
            console.log(value);
            console.log("value ==========");
            let actualHTML = await getHTMLCORS(value);
            // Esto va a generar un array de arrays
            let listadoRutas = await getListProductPage(actualHTML, nombre_hoja[index]);
            // let objConvertidoEnArray = await Object.values(listadoRutas);
            productDataList.push(listadoRutas);

            index += 1;
        }
        // console.log(productDataList);
        // Retorno de un Array>[]Arrays>[]Arrays
        return await productDataList;
    } catch (error) {
        console.log("ERROR EN CREATE CATALOG ARRAY");
        console.log(error);
    }
}

// export { createProductJson, createCatalog };
module.exports = {
    createProductJson,
    createProductArray,
    createCatalog,
    createCatalogArray,
    createCatalogArrayCORS,
};