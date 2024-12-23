import Stripe from 'stripe';

// Using Stripe test key for development
const stripe = new Stripe(process.env.STRIPE_TEST_KEY || 'sk_test_mock', {
  apiVersion: '2024-11-20.acacia',
});

interface PaymentMethod {
  id: string;
  type: 'card';
  last4: string;
}

// Keep only essential payment method management functionality
// Bill payments feature will be implemented in future releases
export async function setupPaymentMethod(
  userId: number,
  paymentMethodId: string
): Promise<PaymentMethod> {
  try {
    // Retrieve the payment method to verify it exists
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    
    // Attach it to the customer (create customer if needed)
    const customers = await stripe.customers.list({
      email: `user_${userId}@example.com`,
      limit: 1,
    });

    let customer;
    if (customers.data.length > 0) {
      customer = customers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: `user_${userId}@example.com`,
        payment_method: paymentMethodId,
      });
    }

    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customer.id,
    });

    return {
      id: paymentMethod.id,
      type: 'card',
      last4: paymentMethod.card?.last4 ?? '****',
    };
  } catch (error) {
    console.error('Error setting up payment method:', error);
    throw new Error('Failed to setup payment method');
  }
}

// Basic webhook handler for payment events
export async function handleWebhook(
  body: Buffer,
  signature: string
): Promise<void> {
  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );

    // Log events for future implementation
    console.log('Received webhook event:', event.type);
  } catch (error) {
    console.error('Error handling webhook:', error);
    throw new Error('Webhook handling failed');
  }
}
