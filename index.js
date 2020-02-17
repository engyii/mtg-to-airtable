const axios = require('axios')
const Airtable = require('airtable')
const _ = require('lodash')
const secret = require('./secret.json')

Airtable.configure({
    endpointUrl: 'https://api.airtable.com',
    apiKey: secret.apiKey
})

const fields = ['uuid', 'number', 'name','text', 'type', 'rarity', 'colors', 'colorIdentity', 'manaCost', 'power', 'toughness', 'scryfallIllustrationId', 'scryfallId']
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
        await base(table).create(record, {typecast: true}).catch(err => displayErrorMsgs(err, record))
        console.log("Non-existing record '" + record[primaryKey] + "' Created")
    } else {

        if (!doNotUpdate) {
            await base(table).replace(existingRecord.id, record, {typecast: true}).catch(err => displayErrorMsgs(err, record))
            console.log("Existing record '" + record[primaryKey] + "' Updated")
        } else {
            console.log("Existing record '" + record[primaryKey] + "' Untouched")
        }
    }

}
const importImage = async (scryfallId) => {

}

const importTheros = async (season) => {
    const res = await axios.get('https://www.mtgjson.com/json/THB.json')
    console.log(res.data.cards)
    return await Promise.all(res.data.cards.map(card => createOrUpdateRecord(_.pick(card, fields) , 'THB', 'uuid')))
}

importTheros();


