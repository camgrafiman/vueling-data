const axios = require("axios");
const cheerio = require("cheerio");
const { create } = require("xmlbuilder2");
const { promises } = require("fs");
const formatXml = require("xml-formatter");
// import { formatXml } from 'xml-formatter';

async function getHTML(url = "") {
    try {
        const { data: html } = await axios.get(url);
        // const { data: html } = await axios
        //     .get(url, {
        //         proxy: {
        //             protocol: "http",
        //             host: "localhost",
        //             port: 5000,
        //         },
        //     })
        //     .then((data) => {
        //         console.log(data);
        //     })
        //     .catch((err) => console.log(err));
        // console.log("URL de getHTML. ", url);
        // const html = await axios.get(url);
        // console.log(html);

        return html;
    } catch (error) {
        console.log("^^^^^^^-------- ERROR EN AXIOS ------^^^^^^");
        console.log(error);
    }
}

let dataProductsActual = {};

/* Función que usa los datos html, busca el script window.__INITIAL_STATE__ y devuelve el JSON scriptObject de una página de producto. */
async function getSingleProductData(htmlData, group, prodLandingUrl, quincena) {
    try {
        const $ = cheerio.load(htmlData);
        let scriptObject = {};

        const product = $(".product");
        console.log(product);

        const url = prodLandingUrl;

        const productid = product.attr("data-productid");
        console.log(productid);

        const detailProduct = product.children(".detail-product");
        const imageLink = detailProduct.find("img.responsive-img").attr("src");

        const nombreProducto = detailProduct.find("h2").text();
        const precioProducto = detailProduct.find("div.sheet-product-price").text().trim();

        const pictos = product.find(".sheet-product-icons>img");

        var pictoImgs = [];
        console.log("LENGTH DE PICTOS: ", pictos.length);

        switch (pictos.length) {
            case 0:
                pictoImgs = [
                    "https://camaleongrafico.com/caprabo/imagenes/blank.png",
                    "https://camaleongrafico.com/caprabo/imagenes/blank.png",
                    "https://camaleongrafico.com/caprabo/imagenes/blank.png",
                ];
                break;
            case 1:
                pictoImgs = [
                    product.find(".sheet-product-icons>img:nth-child(1)").attr("src"),
                    "https://camaleongrafico.com/caprabo/imagenes/blank.png",
                    "https://camaleongrafico.com/caprabo/imagenes/blank.png",
                ];
                break;
            case 2:
                pictoImgs = [
                    product.find(".sheet-product-icons>img:nth-child(1)").attr("src"),
                    product.find(".sheet-product-icons>img:nth-child(2)").attr("src"),
                    "https://camaleongrafico.com/caprabo/imagenes/blank.png",
                ];
                break;
            case 3:
                pictoImgs = [
                    product.find(".sheet-product-icons>img:nth-child(1)").attr("src"),
                    product.find(".sheet-product-icons>img:nth-child(2)").attr("src"),
                    product.find(".sheet-product-icons>img:nth-child(3)").attr("src"),
                ];
                break;

            default:
                return [
                    "https://camaleongrafico.com/caprabo/imagenes/blank.png",
                    "https://camaleongrafico.com/caprabo/imagenes/blank.png",
                    "https://camaleongrafico.com/caprabo/imagenes/blank.png",
                ];
                break;
        }

        // console.log(productid);
        // console.log(imageLink);
        // console.log(nombreProducto);
        // console.log(precioProducto);
        // console.log(url);

        scriptObject.productid = productid;
        scriptObject.imageLink = imageLink;
        scriptObject.nombreProducto = nombreProducto;
        scriptObject.precioProducto = precioProducto;
        scriptObject.url = url;
        scriptObject.quincena = quincena;

        scriptObject.pictograma1 = pictoImgs[0];
        scriptObject.pictograma2 = pictoImgs[1];
        scriptObject.pictograma3 = pictoImgs[2];

        console.log(scriptObject);

        return scriptObject;
    } catch (error) {
        console.log(error);
    }
}

async function getListProductPage(htmlData, nombreCatalogo) {
    const $ = cheerio.load(htmlData);
    //console.log($)
    // console.log('====')
    const vuelos = $("table>tbody").children();
    let dataProducts = [];
    // Ciclo que recorre todas las cajas de producto:
    vuelos.each(function(i, elemento) {
        // console.log("elemento de la tabla INICIO ==========");
        // console.log(elemento);
        // console.log("elemento de la tabla FIN ==========");
        let table_tr = $(elemento);
        let td_origen = table_tr
            .find("td[data-test='origin-col']")
            .html()
            .replace(/<span class="sr-only">.*?<\/span>/, "");
        let td_destino = table_tr
            .find("td[data-test='destination-col']")
            .html()
            .replace(/<span class="sr-only">.*?<\/span>/, "");
        let td_trayecto = table_tr.find("td[data-test='fare-type-col']").text();
        let td_fecha = table_tr.find("td[data-test='dates-col']").text();
        let td_precio = table_tr.find("td[data-test='price-col']>div[data-test='price']").text();
        let td_hora = table_tr.find("td[data-test='price-col']>p[data-test='last-seen']").text();
        let td_origen_raw = table_tr.find("td[data-test='origin-col']").html();
        let td_destino_raw = table_tr.find("td[data-test='destination-col']").html();

        // console.log("==== Prod ==== ", i);
        // console.log(td_origen);
        // console.log(td_destino);
        // console.log(td_trayecto);
        // console.log(td_fecha);
        // console.log(td_precio);
        // console.log(td_hora);
        // console.log(td_origen_raw);
        // console.log(td_destino_raw);
        // console.log("==== FIN Prod ==== ", i);

        // dataProducts.push({
        //     idNumber: i,
        //     nombreCatalogo,
        //     timeStamp: Math.floor(Date.now() / 1000),
        //     td_origen,
        //     td_destino,
        //     td_trayecto,
        //     td_fecha,
        //     td_precio,
        //     td_hora,
        //     td_origen_raw,
        //     td_destino_raw,
        // });

        const fechaHoraActual = new Date();

        const dia = fechaHoraActual.getDate();
        const mes = fechaHoraActual.getMonth() + 1; // ¡Recuerda que los meses en JavaScript son indexados desde 0!
        const año = fechaHoraActual.getFullYear();
        const horas = fechaHoraActual.getHours();
        const minutos = fechaHoraActual.getMinutes();
        const segundos = fechaHoraActual.getSeconds();

        dataProducts.push([
            i,
            nombreCatalogo,
            `${año}-${mes < 10 ? "0" + mes : mes}-${dia < 10 ? "0" + dia : dia} ${horas}:${minutos}:${segundos}`,
            td_origen,
            td_destino,
            td_trayecto,
            td_fecha,
            td_precio,
            td_hora,
            td_origen_raw,
            td_destino_raw,
        ]);

        // let dataNature = item.attr("data-nature") || "";
        // let dataFamily = item.attr("data-vada-family") || "";
        // let dataDepartment = item.attr("data-vada-department") || "";
        // let dataSubdepartment = item.attr("data-vada-subdepartment") || "";
        // let dataUniverse = item.attr("data-vada-universe") || "";
        // let modelId = item
        //     .find("div.dkt-product-slider__slide")
        //     .attr("data-modelid");
        // let dataRepositoryId =
        //     item
        //     .find("div.dkt-product-slider__image")
        //     .attr("data-product-repository-id") || "";
        // let imgSource = item
        //     .find("div.dkt-product-slider__image > picture > source:nth-child(5)")
        //     .attr("srcset");
        // let imgJPGConvert = item
        //     .find("div.dkt-product-slider__image > picture > source:nth-child(1)")
        //     .attr("srcset");
        // let brand =
        //     item.find("span.dkt-product__brand> span").text().trim() || "no_brand";
        // let productUrl =
        //     "https://www.decathlon.es" +
        //     item.find("a.dkt-product__title__wrapper").attr("href");
        // let title = item.find("h2.dkt-product__title").text().trim();
        // let price = item
        //     .find("div.dkt-price__cartridge")
        //     .text()
        //     .trim()
        //     .replace("€", "");
        // let pricedata = item.find("div.dkt-price__cartridge").attr("data-price");
        // let previousPrice =
        //     item
        //     .find("span.dkt-price__previous-price")
        //     .text()
        //     .trim()
        //     .replace("€", "")
        //     .replace(",", ".") || "0";
        // let reviews =
        //     item.find("span.dkt-product__review-count").text().trim() || "(0)";

        // console.log('==== Prod ==== ', i)
        // console.log(dataNature)
        // console.log(dataFamily)
        // console.log(modelId)
        // console.log(dataRepositoryId)
        // console.log(brand.trim())
        // console.log(productUrl)
        // console.log(title.trim())
        // console.log(price.trim())
        // console.log(pricedata.trim())
        // console.log(previousPrice)
        // console.log(imgSource)
        // console.log(strImg)

        // if (imgJPGConvert !== undefined) {
        //     imgJPGConvert.replace("webp", "jpg");
        // }

        // let rutaImg = imgSource || imgJPGConvert;
        // console.log(rutaImg)

        // dataProducts.push({
        //     idNumber: i,
        //     dataNature: dataNature,
        //     dataFamily: dataFamily,
        //     dataDepartment: dataDepartment,
        //     dataSubdepartment: dataSubdepartment,
        //     dataUniverse: dataUniverse,
        //     modelId: modelId,
        //     dataRepositoryId: dataRepositoryId,
        //     imgSource: imgSource,
        //     imgJPGConvert: imgJPGConvert,
        //     brand: brand,
        //     productUrl: productUrl,
        //     title: title,
        //     price: price,
        //     pricedata: pricedata,
        //     previousPrice: previousPrice,
        //     reviews: reviews,
        // });

        // console.log('===== Fin prod === ', i)
    });

    // await createXML(dataProducts, nombreCatalogo);

    // console.log(dataProducts);
    // dataProductsActual[nombreCatalogo] = dataProducts;
    return dataProducts;
}

async function createXML(dataProductsList, nombreCatalogo) {
    const root = await create({ version: "1.0", encoding: "UTF-8" }).ele("Products");
    // ahora itero sobre la lista de elementos:
    for (let i = 0; i < dataProductsList.length; i++) {
        console.log(dataProductsList);
        const producto = root.ele("Product");
        producto
            .ele("unique_id")
            .txt(dataProductsList[i].unique_id)
            .up()
            .ele("reporting_label")
            .txt(dataProductsList[i].reporting_label)
            .up()
            .ele("categoria")
            .txt(dataProductsList[i].categoria)
            .up()
            .ele("cat_list")
            .txt(dataProductsList[i].cat_list)
            .up()
            .ele("product_id")
            .txt(dataProductsList[i].product_id)
            .up()
            .ele("peso")
            .txt("1")
            .up()
            .ele("disponible")
            .txt("true")
            .up()
            .ele("por_defecto")
            .txt(dataProductsList[i].por_defecto)
            .up()
            .ele("nombre_producto")
            .txt(dataProductsList[i].nombre_producto)
            .up()
            .ele("precio_actual")
            .txt(dataProductsList[i].precio_actual)
            .up()
            .ele("precio")
            .txt(dataProductsList[i].precio)
            .up()
            .ele("oferta")
            .txt(dataProductsList[i].oferta)
            .up()
            .ele("url_destino")
            .txt(dataProductsList[i].url_destino)
            .up()
            .ele("ruta_imagen")
            .txt(dataProductsList[i].ruta_imagen)
            .up()
            .ele("extra1")
            .txt("in stock")
            .up()
            .ele("extra2")
            .txt(dataProductsList[i].url_destino)
            .up()
            .ele("extra1")
            .txt("caprabo")
            .up();
    }

    const xml = root.end({ prettyPrint: true });

    // console.log(' -------------------- XML ----------------------------------------------------')
    // console.log(xml);

    try {
        await promises.writeFile("./tmp/" + nombreCatalogo + ".xml", formatXml(xml, { collapseContent: true }), "utf8");
        console.log("EL FICHERO XML HA SIDO ACTUALIZADO.");
    } catch (e) {
        console.error(e, "ERROR a la hora de generar el XML.");
    } finally {
        console.log("ASYNC CreateXML función se ha ejecutado.");
    }
}

async function returnXML(dataProductsList) {
    const root = await create({ version: "1.0", encoding: "UTF-8" }).ele("Products");
    // ahora itero sobre la lista de elementos:
    for (let i = 0; i < dataProductsList.length; i++) {
        const producto = root.ele("Product");
        producto
            .ele("active_label")
            .txt(dataProductsList[i].active_label)
            .up()
            .ele("active_marketplace")
            .txt(dataProductsList[i].active_marketplace)
            .up()
            .ele("availability")
            .txt(dataProductsList[i].availability)
            .up()
            .ele("brand")
            .txt(dataProductsList[i].brand)
            .up()
            .ele("bu")
            .txt(dataProductsList[i].bu)
            .up()
            .ele("condition")
            .txt(dataProductsList[i].condition)
            .up()
            .ele("description")
            .txt(dataProductsList[i].description)
            .up()
            .ele("ean")
            .txt(dataProductsList[i].ean)
            .up()
            .ele("gtin")
            .txt(dataProductsList[i].gtin)
            .up()
            .ele("image_link")
            .txt(dataProductsList[i].image_link)
            .up()
            .ele("link")
            .txt(dataProductsList[i].link)
            .up()
            .ele("price")
            .txt(dataProductsList[i].price)
            .up()
            .ele("sale_price")
            .txt(dataProductsList[i].sale_price)
            .up()
            .ele("product_type")
            .txt(dataProductsList[i].product_type)
            .up()
            .ele("product_id")
            .txt(dataProductsList[i].product_id)
            .up()
            .ele("sold_by_crf")
            .txt(dataProductsList[i].sold_by_crf)
            .up()
            .ele("title")
            .txt(dataProductsList[i].title)
            .up()
            .ele("is_textil")
            .txt(dataProductsList[i].is_textil)
            .up()
            .ele("id")
            .txt(dataProductsList[i].id)
            .up()
            .ele("offer_id")
            .txt(dataProductsList[i].offer_id)
            .up()
            .ele("category1")
            .txt(dataProductsList[i].category1)
            .up()
            .ele("category2")
            .txt(dataProductsList[i].category2)
            .up();
    }

    const xml = root.end({ prettyPrint: true });

    return xml;
}

// export { getHTML, getListProductPage, dataProductsActual, getSingleProductData, createXML };
module.exports = {
    getHTML,
    getListProductPage,
    dataProductsActual,
    getSingleProductData,
    createXML,
    returnXML,
};