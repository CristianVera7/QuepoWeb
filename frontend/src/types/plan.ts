export interface IPlan {
    _id: string
    title: string
    category: string
    description: string
    location: string
    dateTime: string
    creatorNickName: string
    carInformation?: {
        brand: string
        model: string
        color: string
        carIdentifier: string
    }
    passengers?: { _id: string; nickName: string }[]
    placesAvailable: number
}