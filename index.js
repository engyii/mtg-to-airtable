const axios = require('axios')
const Airtable = require('airtable')
const _ = require('lodash')
const secret = require('./secret.json')

Airtable.configure({
    endpointUrl: 'https://api.airtable.com',
    apiKey: secret.apiKey
})

const scryfallFields = ['id', 'arena_id', 'set', 'collector_number', 'name', 'oracle_text', 'type_line', 'rarity','color_identity', 'colors', 'mana_cost', 'cmc', 'power', 'toughness' ]

const base = Airtable.base(secret.db)

const findRecord = async (table, filter) => {
    const records = await base(table).select({
        maxRecords: 1,
        filterByFormula: filter
    }).firstPage().catch(displayErrorMsgs)

    return (records && records.length > 0) ? records[0] : null
}

const displayErrorMsgs = function() {
    [].concat(arguments).forEach(arg => console.error(arg))
}

const createOrUpdateRecord = async (record, table, primaryKey, doNotUpdate) => {

    const existingRecord = await findRecord(table, primaryKey + " = '" + record[primaryKey] + "'")

    if (!existingRecord) {
        await base(table).create(record, {typecast: true})
        console.log("Non-existing record '" + record[primaryKey] + "' Created")
    } else {

        if (!doNotUpdate) {
            await base(table).replace(existingRecord.id, record, {typecast: true})
            console.log("Existing record '" + record[primaryKey] + "' Updated")
        } else {
            console.log("Existing record '" + record[primaryKey] + "' Untouched")
        }
    }

}

const importTherosFromScryfall = async (season) => {
    try {
        let page = 'https://api.scryfall.com/cards/search?format=json&include_extras=false&include_multilingual=false&order=name&page=1&q=e%3Dthb&unique=cards'
        do {
            const { data : { data:cards, next_page} } = await axios.get(page)
            //console.log({ ...(_.pick(cards[0], scryfallFields)), img: { url: cards[0].image_uris.large}, art_crop: { url: cards[0].image_uris.art_crop }, ...(_.pick(cards[0].related_uris, ['gatherer', 'mtgtop8', 'tcgplayer_decks'])) })
            await Promise.all(cards.map(card => createOrUpdateRecord({ ...(_.pick(card, scryfallFields)), img: [{ url: card.image_uris.large}], art_crop: [{ url: card.image_uris.art_crop }], ...(_.pick(card.related_uris, ['gatherer', 'mtgtop8', 'tcgplayer_decks'])) } , 'Cards', 'id')))
            page = next_page
        } while(page)
    } catch(e) {
        console.log(e)
    }
}

importTherosFromScryfall();


