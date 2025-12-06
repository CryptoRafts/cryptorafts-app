# Vercel Environment Variable Setup
# Run these commands in your terminal (after installing Vercel CLI: npm i -g vercel)

# Add ADMIN_WALLET_PRIVATE_KEY to Vercel
vercel env add ADMIN_WALLET_PRIVATE_KEY production
# When prompted, paste: d29c85ad15f9b9413117b5515b48ed574145ad82da14d40dbba29df95681faa8

vercel env add ADMIN_WALLET_PRIVATE_KEY preview
# When prompted, paste: d29c85ad15f9b9413117b5515b48ed574145ad82da14d40dbba29df95681faa8

vercel env add ADMIN_WALLET_PRIVATE_KEY development
# When prompted, paste: d29c85ad15f9b9413117b5515b48ed574145ad82da14d40dbba29df95681faa8

# Or use this single command (if supported):
vercel env add ADMIN_WALLET_PRIVATE_KEY production preview development
# When prompted, paste: d29c85ad15f9b9413117b5515b48ed574145ad82da14d40dbba29df95681faa8

# After adding, redeploy:
vercel --prod
