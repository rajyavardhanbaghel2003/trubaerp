-- When a payment is created, mark the related fee as paid (securely)

CREATE OR REPLACE FUNCTION public.mark_fee_paid_from_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated_count integer;
BEGIN
  -- Only act on successful payments
  IF NEW.status IS DISTINCT FROM 'completed' THEN
    RETURN NEW;
  END IF;

  -- Mark the matching fee as paid (and ensure the payment belongs to the same user)
  UPDATE public.fees f
  SET status = 'paid',
      updated_at = now()
  WHERE f.id = NEW.fee_id
    AND f.user_id = NEW.user_id
    AND f.status <> 'paid'
    AND f.amount = NEW.amount;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  IF v_updated_count = 0 THEN
    RAISE EXCEPTION 'Invalid payment: fee not found / already paid / user mismatch / amount mismatch';
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger once
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_payments_mark_fee_paid'
  ) THEN
    CREATE TRIGGER trg_payments_mark_fee_paid
    AFTER INSERT ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION public.mark_fee_paid_from_payment();
  END IF;
END;
$$;