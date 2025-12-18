-- Unlink Notion integration for testing
DELETE FROM linked_apps 
WHERE user_id = 'f1fc5453-8d63-4686-807c-14355b6de622' 
AND provider = 'notion';

DELETE FROM oauth_tokens 
WHERE user_id = 'f1fc5453-8d63-4686-807c-14355b6de622' 
AND provider = 'notion';
