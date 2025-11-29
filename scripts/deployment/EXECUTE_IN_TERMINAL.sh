cd /var/www/cryptorafts 2>/dev/null || mkdir -p /var/www/cryptorafts && cd /var/www/cryptorafts && 
cat > RUN_THIS_IN_SSH_NOW.sh << 'DEPLOYEOF'

DEPLOYEOF
chmod +x RUN_THIS_IN_SSH_NOW.sh && bash RUN_THIS_IN_SSH_NOW.sh