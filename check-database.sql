-- Check what's in the database
SELECT 'oauth_tokens' as table_name, COUNT(*) as count FROM oauth_tokens
UNION ALL
SELECT 'linked_apps', COUNT(*) FROM linked_apps
UNION ALL
SELECT 'cli_sessions', COUNT(*) FROM cli_sessions;
