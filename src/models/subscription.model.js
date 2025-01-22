import mongoose, {Schema} from 'mongoose';


const subscriptionSchema = new Schema({})

export const subscription = mongoose.model('subscription', subscriptionSchema);