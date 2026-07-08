from supabase import create_client, Client
from config import settings

'''
manual filtering used at the time to only get rows for the currently logged in user
more verbose and simple but a liability if its forgotten in a query. service/secret key completely
bypasses RLS so this is critical. the solution that could be implemented down the line would be
using JWT token as is on supabase calls so supabase can assume role of authenticated user and letting
RLS trigger automatically
'''
supabase: Client = create_client(settings.supabase_url, settings.supabase_service_role_key)
