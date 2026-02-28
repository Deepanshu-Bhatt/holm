import api from './axios'

export const getPackages = async () => {
  const res = await api.get('/tokens/packages')
  return res.data
}

export const createOrder = async (packageId: number) => {
  const res = await api.post('/tokens/order', { packageId })
  return res.data
}

export const verifyPayment = async (data: {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}) => {
  const res = await api.post('/tokens/verify', data)
  return res.data
}

export const getTokenHistory = async () => {
  const res = await api.get('/tokens/history')
  return res.data
}