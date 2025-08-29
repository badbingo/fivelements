import hashlib

passwords = ['hello', 'Hello', 'HELLO', 'hello123', 'Hello123', 'password', 'Password', '123456', 'admin', 'test']
target = '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92'

for p in passwords:
    h = hashlib.sha256(p.encode()).hexdigest()
    print(f'{p}: {h}')
    if h == target:
        print(f'MATCH FOUND: {p}')