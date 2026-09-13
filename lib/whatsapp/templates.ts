export function carInquiryTemplate(data: {
  ownerName: string;
  carName: string;
  carUrl: string;
}) {
  return `Hi ${data.ownerName}! 👋

I found your *${data.carName}* on LORA Rentals and I'm interested in renting it.

Could you please share:
• Availability for my dates
• Final price (RWF)
• Pickup location details

Car link: ${data.carUrl}

Thanks!`;
}

export function bookingFollowupTemplate(data: {
  ownerName: string;
  carName: string;
  bookingId: string;
  pickupDate: string;
  returnDate: string;
}) {
  return `Hi ${data.ownerName}! 👋

I just booked your *${data.carName}* on LORA Rentals.

Booking #: ${data.bookingId}
Dates: ${data.pickupDate} → ${data.returnDate}

Looking forward to pickup! Any specific instructions?

Thanks! 🚗`;
}

export function ownerTestTemplate(data: { ownerName: string }) {
  return `Hi ${data.ownerName}! ✅

This is a test from LORA Rentals to confirm your WhatsApp is working. Customers will use this to reach you about your cars.`;
}
