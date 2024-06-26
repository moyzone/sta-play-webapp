// @ts-ignore
import { openDB, deleteDB } from 'https://cdn.jsdelivr.net/npm/idb@8/+esm'

/**
 * @typedef {IDBDatabase & {
 *  get, getKey, getAll, getAllKeys, count, put, add, delete, clear,
 *  getFromIndex, getKeyFromIndex, getAllFromIndex, getAllKeysFromIndex, countFromIndex
 * }} IDBPDatabase
 * From the IDB library
 */
/**
 * @typedef {IDBTransaction & {store, done}} IDBPTransaction
 * From the IDB library
 */

const DB_NAME = 'STAPlayApp'
const DB_VERSION = 1
const STORE = {
    GENERAL: 'general',
    TRAITS: 'traits',
    PLAYERS: 'players',
    TRACKERS: 'trackers'
}
const INDEX = {
    ID: 'id',
    NAME: 'name'
}

export class GeneralInfo {
    /**
     * @type {number|undefined}
     */
    id

    /**
     * @type {string}
     */
    text

    /**
     * @type {string}
     */
    shipName

    /**
     * @type {File|undefined}
     */
    shipModel

    /**
     * @type {number}
     */
    momentum

    /**
     * @type {string}
     */
    activeAlert

    /**
     * Create a new General Info object
     * @param {string} text general screen text
     * @param {string} shipName name of the ship
     * @param {number|string} momentum amount of momentum in the player's pool
     * @param {string} activeAlert which alert is active
     * @param {File} [shipModel] ship's 3D model
     */
    constructor (text, shipName, momentum, activeAlert, shipModel = undefined) {
        this.id = 0
        this.text = text
        this.shipName = shipName
        this.momentum = typeof (momentum) === 'number' ? momentum : parseInt(momentum)
        this.activeAlert = activeAlert
        this.shipModel = shipModel
    }
}

export class NamedInfo {
    /**
     * @type {string}
     */
    name

    /**
     * Create a named info object
     * @param {string} name the name
     */
    constructor (name) {
        this.name = name
    }
}

export class PlayerInfo extends NamedInfo {
    /**
     * @type {number|undefined}
     */
    id

    /**
     * @type {number}
     */
    currentStress

    /**
     * @type {number}
     */
    maxStress

    /**
     * @type {string}
     */
    pips

    /**
     * @type {string}
     */
    borderColor

    /**
     * @type {File|undefined}
     */
    image

    /**
     * Create a Player info
     * @param {number|string} id                    player id
     * @param {string} name                         player character's name
     * @param {number} currentStress                current stress value
     * @param {number} maxStress                    maximum stress value
     * @param {string} pips                         the pips text
     * @param {string} borderColor                  the color option text
     * @param {File|undefined} [image]    image of the player's character
     */
    constructor (id, name, currentStress, maxStress, pips, borderColor, image = undefined) {
        super(name)
        this.id = typeof (id) === 'number' ? id : parseInt(id)
        this.currentStress = typeof (currentStress) === 'number' ? currentStress : parseInt(currentStress)
        this.maxStress = typeof (maxStress) === 'number' ? maxStress : parseInt(maxStress)
        this.pips = pips
        this.borderColor = borderColor
        this.image = image
    }
}

export class TrackerInfo extends NamedInfo {
    /**
     * @type {number}
     */
    resistance

    /**
     * @type {number}
     */
    complicationRange

    /**
     * @type {string}
     */
    attribute

    /**
     * @type {string}
     */
    department

    /**
     * @type {number}
     */
    progressTrack

    /**
     * Create a Combat/Extended Tracker Info
     * @param {string} name                     the tracker's name
     * @param {string} attribute                the applicable attribute
     * @param {string} department               the applicable discipline/department
     * @param {number|string} progressTrack     the amount left to progress through
     * @param {number|string} resistance        the amount of resistance
     * @param {number|string} complicationRange the complication range
     */
    constructor (name, attribute, department, progressTrack, resistance = 0, complicationRange = 0) {
        super(name)
        this.attribute = attribute
        this.department = department
        this.progressTrack = typeof (progressTrack) === 'number' ? progressTrack : parseInt(progressTrack)
        this.resistance = typeof (resistance) === 'number' ? resistance : parseInt(resistance)
        this.complicationRange = typeof (complicationRange) === 'number' ? complicationRange : parseInt(complicationRange)
    }
}

export class Database {
    async clear () {
        await deleteDB(DB_NAME)
    }

    /**
     * Open and return the database reference
     * @returns {Promise<IDBPDatabase>}    handle to the database
     */
    async open () {
        return await openDB(DB_NAME, DB_VERSION, { upgrade: db => this.#upgrade(db) })
    }

    /**
     * Upgrade the database
     * @param {IDBPDatabase} db the database
     */
    #upgrade (db) {
        this.#create(db) // currently, no fancy upgrade logic, just replace
    }

    /**
     * Create the database
     * @param {IDBPDatabase} db the database
     */
    #create (db) {
        if (db.objectStoreNames.contains(STORE.GENERAL))
            db.deleteObjectStore(STORE.GENERAL)
        if (db.objectStoreNames.contains(STORE.TRAITS))
            db.deleteObjectStore(STORE.TRAITS)
        if (db.objectStoreNames.contains(STORE.PLAYERS))
            db.deleteObjectStore(STORE.PLAYERS)
        if (db.objectStoreNames.contains(STORE.TRACKERS))
            db.deleteObjectStore(STORE.TRACKERS)

        console.warn('cleared db for upgrade')
        db.createObjectStore(STORE.GENERAL, { keyPath: INDEX.ID, autoIncrement: false })

        const traitStore = db.createObjectStore(STORE.TRAITS, { keyPath: INDEX.ID, autoIncrement: true })
        traitStore.createIndex(INDEX.NAME, INDEX.NAME, { unique: true })

        const playerStore = db.createObjectStore(STORE.PLAYERS, { keyPath: INDEX.ID, autoIncrement: true })
        playerStore.createIndex(INDEX.NAME, INDEX.NAME, { unique: false })

        const trackerStore = db.createObjectStore(STORE.TRACKERS, { keyPath: INDEX.ID, autoIncrement: true })
        trackerStore.createIndex(INDEX.NAME, INDEX.NAME, { unique: true })
    }

    /**
     * Get the general info from the database
     * @param {IDBPDatabase|undefined} db           the database (else we'll open a new one)
     * @returns {Promise<GeneralInfo|undefined>}    the general database information
     */
    async getInfo (db = undefined) {
        const andClose = typeof (db) === 'undefined'
        db ??= await openDB(DB_NAME, DB_VERSION, { upgrade: db => this.#upgrade(db) })

        const row = await db.count(STORE.GENERAL) !== 0 // has info
            ? await db.get(STORE.GENERAL, 0)
            : undefined

        /** @type {GeneralInfo|undefined} */
        let generalInfo
        if (typeof (row) !== 'undefined') {
            generalInfo = Object.create(GeneralInfo.prototype)
            Object.assign(generalInfo, row)
        }

        if (andClose) db.close()
        return generalInfo
    }

    /**
     * Get the scene traits from the database
     * @param {IDBPDatabase|undefined} db   the database (else we'll open a new one)
     * @returns {Promise<string[]>}         the list of scene traits
     */
    async getTraits (db = undefined) {
        const andClose = typeof (db) === 'undefined'
        db ??= await openDB(DB_NAME, DB_VERSION, { upgrade: db => this.#upgrade(db) })

        /** @type {NamedInfo[]} */
        const rows = await db.getAll(STORE.TRAITS)
        const traits = rows.map(e => e.name)
        if (andClose) db.close()
        return traits
    }

    /**
     * Get the players from the database
     * @param {IDBPDatabase|undefined} db   the database (else we'll open a new one)
     * @returns {Promise<PlayerInfo[]>}     the information for all players
     */
    async getPlayers (db = undefined) {
        const andClose = typeof (db) === 'undefined'
        db ??= await openDB(DB_NAME, DB_VERSION, { upgrade: db => this.#upgrade(db) })

        const rows = await db.getAll(STORE.PLAYERS)
        if (andClose) db.close()
        /** @type {PlayerInfo[]} */
        const data = rows.map(e => {
            /** @type {PlayerInfo} */
            const item = Object.create(PlayerInfo.prototype)
            Object.assign(item, e)
            return item
        })
        return data
    }

    /**
     * Get the trackers from the database
     * @param {IDBPDatabase|undefined} db   the database (else we'll open a new one)
     * @returns {Promise<TrackerInfo[]>}    the information for all trackers
     */
    async getTrackers (db = undefined) {
        const andClose = typeof (db) === 'undefined'
        db ??= await openDB(DB_NAME, DB_VERSION, { upgrade: db => this.#upgrade(db) })

        const rows = await db.getAll(STORE.TRACKERS)
        if (andClose) db.close()
        /** @type {TrackerInfo[]} */
        const data = rows.map(e => {
            /** @type {TrackerInfo} */
            const item = Object.create(TrackerInfo.prototype)
            Object.assign(item, e)
            return item
        })
        return data
    }

    /**
     * Get the general info from the database
     * @param {GeneralInfo} info  data to save
     * @param {IDBPDatabase|undefined} db the database (else we'll open a new one)
     */
    async saveInfo (info, db = undefined) {
        const andClose = typeof (db) === 'undefined'
        db ??= await openDB(DB_NAME, DB_VERSION, { upgrade: db => this.#upgrade(db) })

        info.id = 0 // enforce only a single row
        db.put(STORE.GENERAL, info)
        if (andClose) db.close()
    }

    /**
     * Replace data of a store in the database with new ones
     * @param {string} storeName                Name of the store
     * @param {string} clearIndex               the name of the index to clear
     * @param {any[]} data                      array of info to add
     * @param {IDBPDatabase|IDBDatabase} [db]   the database
     */
    async #replaceData (storeName, clearIndex = INDEX.NAME, data = [], db = undefined) {
        const andClose = typeof (db) === 'undefined'
        db ??= await openDB(DB_NAME, DB_VERSION, { upgrade: db => this.#upgrade(db) })

        /** @type {IDBPTransaction} */
        // @ts-ignore
        const transaction = db.transaction(storeName, 'readwrite')

        // clear traits
        const index = transaction.store.index(clearIndex)
        const pdestroy = index.openCursor()
        await pdestroy.then(async cursor => {
            while (cursor) {
                cursor.delete()
                cursor = await cursor.continue()
            }
        })

        // Add all current traits
        const adds = []
        for (const info of data)
            adds.push(transaction.store.add(info))
        adds.push(transaction.done)
        await Promise.all(adds)
        if (andClose) db.close()
    }

    /**
     * Replace the traits in the database with new ones
     * @param {string[]} traitNames     names of all the traits
     * @param {IDBPDatabase|IDBDatabase} [db] the database
     */
    async replaceTraits (traitNames = [], db = undefined) {
        const traits = traitNames.map(e => new NamedInfo(e))
        this.#replaceData(STORE.TRAITS, INDEX.NAME, traits, db)
    }

    /**
     * Replace the trackers in the database with new ones
     * @param {TrackerInfo[]} trackers all the current tracker infos
     * @param {IDBPDatabase|IDBDatabase} [db] the database
     */
    async replaceTrackers (trackers = [], db = undefined) {
        this.#replaceData(STORE.TRACKERS, INDEX.NAME, trackers, db)
    }

    /**
     * Replace the players in the database with new ones
     * @param {PlayerInfo[]} players all the current player infos
     * @param {IDBPDatabase|IDBDatabase} [db] the database
     */
    async replacePlayers (players = [], db = undefined) {
        this.#replaceData(STORE.PLAYERS, INDEX.NAME, players, db)
    }
}
