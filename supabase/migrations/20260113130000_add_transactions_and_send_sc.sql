-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('send', 'receive', 'collect', 'mystery_box', 'referral_bonus', 'daily_bonus', 'quest_reward', 'admin_bonus')),
  amount bigint NOT NULL,
  balance_after bigint NOT NULL,
  description text,
  related_user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  related_username text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_type ON transactions(type);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Function to send SC to another user
CREATE OR REPLACE FUNCTION send_supercash(
  recipient_username TEXT,
  send_amount BIGINT,
  message TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sender_id uuid;
  sender_username text;
  sender_balance bigint;
  recipient_record RECORD;
  new_sender_balance bigint;
  new_recipient_balance bigint;
BEGIN
  sender_id := auth.uid();
  
  IF sender_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  IF send_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Amount must be positive');
  END IF;
  
  SELECT username, supercash_balance INTO sender_username, sender_balance
  FROM profiles WHERE id = sender_id;
  
  IF sender_balance < send_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
  END IF;
  
  SELECT id, username, supercash_balance INTO recipient_record
  FROM profiles WHERE LOWER(username) = LOWER(recipient_username);
  
  IF recipient_record.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;
  
  IF recipient_record.id = sender_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot send to yourself');
  END IF;
  
  new_sender_balance := sender_balance - send_amount;
  new_recipient_balance := recipient_record.supercash_balance + send_amount;
  
  UPDATE profiles SET supercash_balance = new_sender_balance, updated_at = now()
  WHERE id = sender_id;
  
  UPDATE profiles SET supercash_balance = new_recipient_balance, updated_at = now()
  WHERE id = recipient_record.id;
  
  INSERT INTO transactions (user_id, type, amount, balance_after, description, related_user_id, related_username)
  VALUES (sender_id, 'send', -send_amount, new_sender_balance, message, recipient_record.id, recipient_record.username);
  
  INSERT INTO transactions (user_id, type, amount, balance_after, description, related_user_id, related_username)
  VALUES (recipient_record.id, 'receive', send_amount, new_recipient_balance, message, sender_id, sender_username);
  
  RETURN jsonb_build_object(
    'success', true,
    'sent_amount', send_amount,
    'new_balance', new_sender_balance,
    'recipient', recipient_record.username
  );
END;
$$;

-- Function to get transaction history
CREATE OR REPLACE FUNCTION get_transaction_history(
  limit_count INTEGER DEFAULT 100
)
RETURNS TABLE (
  id uuid,
  type text,
  amount bigint,
  balance_after bigint,
  description text,
  related_username text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT t.id, t.type, t.amount, t.balance_after, t.description, t.related_username, t.created_at
  FROM transactions t
  WHERE t.user_id = auth.uid()
  ORDER BY t.created_at DESC
  LIMIT limit_count;
END;
$$;

-- Function to record a transaction (for internal use)
CREATE OR REPLACE FUNCTION record_transaction(
  p_user_id uuid,
  p_type text,
  p_amount bigint,
  p_description text DEFAULT NULL,
  p_related_user_id uuid DEFAULT NULL,
  p_related_username text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance bigint;
  new_tx_id uuid;
BEGIN
  SELECT supercash_balance INTO current_balance FROM profiles WHERE id = p_user_id;
  
  INSERT INTO transactions (user_id, type, amount, balance_after, description, related_user_id, related_username, metadata)
  VALUES (p_user_id, p_type, p_amount, current_balance, p_description, p_related_user_id, p_related_username, p_metadata)
  RETURNING id INTO new_tx_id;
  
  RETURN new_tx_id;
END;
$$;

-- Update collect_supercash to record transaction
CREATE OR REPLACE FUNCTION collect_supercash(p_user_id UUID)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    pending_amount BIGINT;
    new_balance BIGINT;
BEGIN
    SELECT calculate_pending_supercash(p_user_id) INTO pending_amount;
    
    IF pending_amount > 0 THEN
        UPDATE profiles 
        SET supercash_balance = supercash_balance + pending_amount,
            updated_at = NOW()
        WHERE id = p_user_id
        RETURNING supercash_balance INTO new_balance;
        
        UPDATE user_heroes 
        SET last_collected_at = NOW()
        WHERE user_id = p_user_id AND is_active = true;
        
        INSERT INTO transactions (user_id, type, amount, balance_after, description)
        VALUES (p_user_id, 'collect', pending_amount, new_balance, 'Collected from active heroes');
    END IF;
    
    RETURN COALESCE(pending_amount, 0);
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION send_supercash(TEXT, BIGINT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_transaction_history(INTEGER) TO authenticated;

