const express = require('express');
const { body } = require('express-validator');
const config = require('../config');
const { query } = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { logAudit } = require('../utils/audit');
const logger = require('../utils/logger');

const router = express.Router();

let stripe;
if (config.stripe.secretKey) {
  stripe = require('stripe')(config.stripe.secretKey);
}

// POST /api/billing/create-checkout
router.post('/create-checkout', authenticate, body('priceId').notEmpty(), async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Billing not configured' });

  try {
    const { priceId } = req.body;

    // Get or create Stripe customer
    let customerId = req.user.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user.email,
        name: req.user.full_name,
        metadata: { userId: req.user.id },
      });
      customerId = customer.id;
      await query('UPDATE users SET stripe_customer_id = $1 WHERE id = $2', [customerId, req.user.id]);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${config.frontendUrl}/dashboard/billing?success=true`,
      cancel_url: `${config.frontendUrl}/dashboard/billing?canceled=true`,
      metadata: { userId: req.user.id },
    });

    await logAudit(req.user.id, 'billing.checkout_created', 'billing', null, { priceId }, req.ip);
    res.json({ url: session.url });
  } catch (err) {
    logger.error('Checkout creation failed', err);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// POST /api/billing/portal
router.post('/portal', authenticate, async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Billing not configured' });

  try {
    if (!req.user.stripe_customer_id) {
      return res.status(400).json({ error: 'No billing account found' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: req.user.stripe_customer_id,
      return_url: `${config.frontendUrl}/dashboard/billing`,
    });

    res.json({ url: session.url });
  } catch (err) {
    logger.error('Portal session failed', err);
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

// GET /api/billing/status
router.get('/status', authenticate, async (req, res) => {
  const result = await query(
    `SELECT tier, subscription_status, subscription_period_end, stripe_subscription_id
     FROM users WHERE id = $1`,
    [req.user.id]
  );
  const u = result.rows[0];
  res.json({
    tier: u.tier,
    status: u.subscription_status,
    periodEnd: u.subscription_period_end,
    hasSubscription: !!u.stripe_subscription_id,
    tierLimits: config.tiers[u.tier],
  });
});

module.exports = router;
