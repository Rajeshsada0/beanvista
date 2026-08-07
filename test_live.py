import requests
from bs4 import BeautifulSoup

session = requests.Session()

# 1. Get login page
res = session.get('https://cafe.kitetool.com/login')
soup = BeautifulSoup(res.text, 'html.parser')
token_meta = soup.find('meta', {'name': 'csrf-token'})
csrf_token = token_meta['content'] if token_meta else ''

# 2. Login
login_data = {
    'email': 'super@cafe.com',
    'password': 'password',
    '_token': csrf_token
}
res = session.post('https://cafe.kitetool.com/login', data=login_data)
print('Login Status:', res.status_code)

# 3. Attempt to toggle Tenant 5 (or whichever)
headers = {
    'X-Requested-With': 'XMLHttpRequest',
    'X-XSRF-TOKEN': requests.utils.unquote(session.cookies.get('XSRF-TOKEN', ''))
}
res = session.patch('https://cafe.kitetool.com/superadmin/tenants/5/toggle', headers=headers)
print('Toggle Status:', res.status_code)
print('Toggle Response:', res.text[:500])
