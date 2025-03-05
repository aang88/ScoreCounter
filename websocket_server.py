import asyncio
import json
import websockets
import time

# Shared state
counters = {}
connected_clients = set()
timer_state = {
    "type": "timer-sync",
    "isRunning": False,
    "startTime": 0,
    "pausedTime": 0
}

async def counter_server(websocket):
    client_info = f"{websocket.remote_address[0]}:{websocket.remote_address[1]}"
    print(f"New client connected: {client_info}")
    
    connected_clients.add(websocket)
    try:
        # Send initial counter values
        await websocket.send(json.dumps({
            "type": "counters", 
            "values": counters
        }))
        print(f"Sent initial values to {client_info}: {counters}")
        
        # Send initial timer state
        await websocket.send(json.dumps(timer_state))
        
        async for message in websocket:
            print(f"Received message from {client_info}: {message}")
            data = json.loads(message)

            if data['type'] == 'subtract-counter':
                counter_id = data['id']
                value = data.get('value', 1)
                
                # Prevent negative values
                current_value = counters.get(counter_id, 0)
                new_value = max(0, current_value - value)
                
                counters[counter_id] = new_value
                
                # Broadcast updated counter values to all clients
                await broadcast({
                    "type": "counters",
                    "values": counters
                })
            
            if data.get("type") == "increment":
                counter_id = data.get("counterId")
                
                # Check if we have a valid counter ID
                if not counter_id:
                    print("Warning: Received increment without counter ID")
                    continue
                
                # Create the counter if it doesn't exist
                if counter_id not in counters:
                    counters[counter_id] = 0
                
                # Increment the counter
                counters[counter_id] += 1
                print(f"Incremented {counter_id} to {counters[counter_id]}")
                print(f"All counters now: {counters}")
                
                # Broadcast updated counter values
                await broadcast({
                    "type": "counters",
                    "values": counters
                })
                
            elif data.get("type") == "reset-counters":
                # Reset all counters to zero
                counters.clear()
                print("All counters reset")
                
                # Broadcast updated counter values
                await broadcast({
                    "type": "counters",
                    "values": counters
                })
                
            elif data.get("type") == "timer-start":
                # Update timer state
                global_timer_update({
                    "type": "timer-start",
                    "startTime": data.get("startTime")
                })
                # Broadcast to all clients
                await broadcast(timer_state)
                
            elif data.get("type") == "timer-pause":
                # Update timer state
                global_timer_update({
                    "type": "timer-pause",
                    "pausedTime": data.get("pausedTime")
                })
                # Broadcast to all clients
                await broadcast(timer_state)
                
            elif data.get("type") == "timer-reset":
                # Update timer state
                global_timer_update({
                    "type": "timer-reset"
                })
                # Broadcast to all clients
                await broadcast(timer_state)
                
            elif data.get("type") == "timer-sync-request":
                # Send current timer state to the client
                await websocket.send(json.dumps(timer_state))
                
            elif data.get("type") == "ping":
                # Just respond with a pong to keep the connection alive
                await websocket.send(json.dumps({"type": "pong"}))
    except Exception as e:
        print(f"Error handling client {client_info}: {e}")
    finally:
        connected_clients.remove(websocket)
        print(f"Client disconnected: {client_info}")

# Helper function to update the global timer state
def global_timer_update(new_state):
    global timer_state
    timer_state = new_state

async def broadcast(message):
    if connected_clients:
        # Convert message to JSON
        message_str = json.dumps(message)
        # Send to all connected clients
        await asyncio.gather(
            *[client.send(message_str) for client in connected_clients]
        )
        print(f"Broadcast message to {len(connected_clients)} clients: {message}")

# Start server
async def main():
    # Use 0.0.0.0 to accept connections from any IP
    async with websockets.serve(counter_server, "0.0.0.0", 8765):
        print("WebSocket server started on 0.0.0.0:8765")
        await asyncio.Future()  # Run forever

if __name__ == "__main__":
    asyncio.run(main())