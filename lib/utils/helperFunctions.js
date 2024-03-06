async function validarURL(miurl) {
    try {
        await new URL(miurl);
        return await true;

    } catch (err) {

        return await false;

    }
}

module.exports = { validarURL };