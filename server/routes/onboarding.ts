import { Router } from 'express';
import { users } from '@db/schema';
import { db } from '@db';
import { eq } from 'drizzle-orm';
import { jwtAuth } from '../middleware/jwtAuth';

const router = Router();

// Accept terms and privacy policy
router.post('/accept-terms', jwtAuth, async (req, res) => {
  console.log('[Onboarding] Terms acceptance request');
  const userId = req.user.id;

  try {
    // Update user's legal consent
    await db
      .update(users)
      .set({
        legalConsent: {
          termsAccepted: true,
          privacyAccepted: true,
          acceptedAt: new Date().toISOString(),
          version: '1.0' // Update this when terms/privacy change
        },
        consentVersion: '1.0',
        onboardingStep: 2 // Move to next step
      })
      .where(eq(users.id, userId));

    console.log(`[Onboarding] Terms accepted for user ${userId}`);
    res.json({ message: 'Terms accepted successfully' });
  } catch (error) {
    console.error('[Onboarding] Error accepting terms:', error);
    res.status(500).json({ error: 'Failed to update terms acceptance' });
  }
});

// Get onboarding status
router.get('/status', jwtAuth, async (req, res) => {
  console.log('[Onboarding] Status check request');
  const userId = req.user.id;

  try {
    const [user] = await db
      .select({
        onboardingStep: users.onboardingStep,
        hasCompletedOnboarding: users.hasCompletedOnboarding,
        legalConsent: users.legalConsent,
        consentVersion: users.consentVersion
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    console.log(`[Onboarding] Retrieved status for user ${userId}`);
    res.json(user);
  } catch (error) {
    console.error('[Onboarding] Error fetching status:', error);
    res.status(500).json({ error: 'Failed to fetch onboarding status' });
  }
});

export default router;