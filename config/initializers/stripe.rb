ENV['STRIPE_API_VERSION'] = "2020-02-02"
Stripe.api_key = ENV['STRIPE_SECRET_KEY']
STRIPE_PUBLIC_KEY = ENV['STRIPE_PUBLISHABLE_KEY']