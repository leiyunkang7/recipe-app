import socket

sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.settimeout(2)
result = sock.connect_ex(('localhost', 3000))
if result == 0:
    print("Port 3000 is open")
else:
    print("Port 3000 is closed")
sock.close()