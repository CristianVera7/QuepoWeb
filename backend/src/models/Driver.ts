import mongoose from 'mongoose'

export interface Driver {
    dni: string
    carIdentifier: string
    placesAvailable: number
    passengers: string[]
}

const driverSchema = new mongoose.Schema({
    dni: { type: String, required: true, unique: true },
    carIdentifier: { type: String, required: true },
    placesAvailable: { type: Number, required: true },
    passengers: [{ type: String }] // array de strings (IDs o nombres de usuarios, o incluso DNI)
})

export default mongoose.model('Driver', driverSchema)