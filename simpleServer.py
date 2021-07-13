
# WS server example

import asyncio
import websockets


import sys
from os import path
sys.path.append(path.abspath('/home/ubuntu/virtualAssistant'))

from virtual_assistant import VirtualAssistant


async def hello(websocket, path):
    name = await websocket.recv()
    print(f"< {name}")

    greeting = f"Hello {name}!"

    await websocket.send(greeting)
    print(f"> {greeting}")
    if name == 'stop':
        return

if __name__ == '__main__':

    low_confidence = -2.94 
    high_confidence = 2.94
    start_server = websockets.serve(hello, "", 5000)
    asyncio.get_event_loop().run_until_complete(start_server)
    asyncio.get_event_loop().run_forever()
