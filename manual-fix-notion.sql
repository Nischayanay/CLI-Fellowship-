-- Manually insert Notion integration for testing
-- Replace with your actual user_id

INSERT INTO linked_apps (
    user_id,
    provider,
    connected,
    workspace_id,
    workspace_name,
    created_at,
    updated_at
) VALUES (
    'f1fc5453-8d63-4686-807c-14355b6de622',  -- Your user_id
    'notion',
    true,
    '9e5b1c40-e172-4faf-8ceb-41241ca2cf32',  -- From your success message
    'anay''s Notion',
    NOW(),
    NOW()
)
ON CONFLICT (user_id, provider) 
DO UPDATE SET 
    connected = true,
    workspace_id = EXCLUDED.workspace_id,
    workspace_name = EXCLUDED.workspace_name,
    updated_at = NOW();
