import mongoose, { Mongoose } from "mongoose"
import { DBConnect } from "../utils/DBConnect"

(async () => {
    DBConnect().then(async (db: Mongoose) => {
        //delete dbName data
        const dbName = "data"
        const collections = await db.connection.db?.listCollections().toArray()

        if (collections) {
            for (const collection of collections) {
                await db.connection.db?.dropCollection(collection.name)
                console.log(`Collection ${collection.name} has been dropped.`)
            }
        }
    })
    .finally(() => {
        mongoose.connection.close()
        console.log("Database connection closed.")
    })
})()