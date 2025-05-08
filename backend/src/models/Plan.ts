import mongoose from 'mongoose'

export interface Plan {
  title: string
  category: string
  description: string
  route: {
    location: {
      origin: string
      destination: string
    }
    duration: string
    distance: string
  }
  dateTime: Date
  creatorUser: string
  creatorNickName: string
  dni: string
  placesAvailable: number
  price: number
  passengers: string[]
  pendingPassengers: string[]
  carInformation: {
    carIdentifier: string
    brand: string
    model: string
    color: string
  }
}

const planSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: {
    type: String,
    required: true,
    enum: ['Pesca', 'Senderismo', 'Escalada'],
  },
  description: { type: String, required: true },
  route: {
    location: {
      origin: { type: String, required: true },
      destination: { type: String, required: true },
    },
    duration: { type: String, required: true },
    distance: { type: String, required: true },
  },
  dateTime: { type: Date, required: true },
  creatorUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  creatorNickName: { type: String, required: true },
  dni: { type: String, required: true },
  placesAvailable: { type: Number, required: true },
  price: { type: Number, required: true },
  passengers: [{
    id: { type: String },
    nickName: { type: String },
    dni: { type: String },
    isApproved: { type: Boolean, default: false }
  }],
  pendingPassengers: [{
    id: { type: String },
    nickName: { type: String },
    dni: { type: String },
    message: { type: String, default: '' }
  }],
  carInformation: {
    carIdentifier: { type: String },
    brand: { type: String },
    model: { type: String },
    color: { type: String },
  },
})

export default mongoose.model('Plan', planSchema)