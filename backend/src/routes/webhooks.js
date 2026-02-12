const express = require('express');
const config = require('../config');
const { query } = require('../config/db');
const logger = require('../utils/logger');
const { logAudit } = require('../utils/audit');

const router = express.Router();

let stripe;
if (config.stripe.secretKey) {
  stripe = require('stripe')(config.stripe.secretKey);
}

// Determine tier from Stripe price ID
function tierFromPrice(priceId) {
  const prices = config.stripe.prices;
  if (priceId === prices.pro_monthly || priceId === prices.pro_yearly) return 'pro';
  if (priceId === prices.enterprise_monthly || priceId === prices.enterprise_yearly) return 'enterprise';
  return 'free';
}

// POST /api/webhooks/stripe
// Note: This route must receive raw body — configured in index.js
router.post('/stripe', async (req, res) => {
  if (!stripe) return res.status(503).send('Billing not configured');

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, config.stripe.webhookSecret);
  } catch (err) {
    logger.error('Webhook signature verification failed', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        const priceId = subscription.items.data[0].price.id;
        const tier = tierFromPrice(priceId);

        await query(
          `UPDATE users SET
            tier = $1,
            stripe_subscription_id = $2,
            subscription_status = 'active',
            subscription_period_end = to_timestamp($3)
          WHERE stripe_customer_id = $4`,
          [tier, subscription.id, subscription.current_period_end, session.customer]
        );

        logger.info(`Subscription activated: ${session.customer} -> ${tier}`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const priceId = subscription.items.data[0].price.id;
        const tier = tierFromPrice(priceId);
        const status = subscription.status === 'active' ? 'active' :
                       subscription.status === 'past_due' ? 'past_due' :
                       subscription.status === 'trialing' ? 'trialing' : 'canceled';

        await query(
          `UPDATE users SET
            tier = $1,
            subscription_status = $2,
            subscription_period_end = to_timestamp($3)
          WHERE stripe_subscription_id = $4`,
          [tier, status, subscription.current_period_end, subscription.id]
        );
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await query(
          `UPDATE users SET
            tier = 'free',
            subscription_status = 'canceled',
            stripe_subscription_id = NULL
          WHERE stripe_subscription_id = $1`,
          [subscription.id]
        );
        logger.info(`Subscription canceled: ${subscription.id}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        await query(
          `UPDATE users SET subscription_status = 'past_due'
           WHERE stripe_customer_id = $1`,
          [invoice.customer]
        );
        logger.warn(`Payment failed for customer: ${invoice.customer}`);
        break;
      }
    }

    res.json({ received: true });
  } catch (err) {
    logger.error('Webhook handler error', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;
