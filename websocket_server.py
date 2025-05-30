import asyncio
import json
import websockets
import time
import socket

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
    global timer_state
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
                counter_id = data.get('counterId')
                if not counter_id:
                    print("Warning: Received subtract-counter without counter ID")
                    return
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
                value = data.get("value", 1)
                
                # Check if we have a valid counter ID
                if not counter_id:
                    print("Warning: Received increment without counter ID")
                    continue
                
                # Create the counter if it doesn't exist
                if counter_id not in counters:
                    counters[counter_id] = 0
                
                # Increment the counter
                counters[counter_id] += value
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
                # Store the duration in a local variable
                duration = data.get("duration", timer_state.get("duration", 60))
                
                # Calculate current timestamp for elapsed time calculation
                current_time = int(time.time() * 1000)
                start_time = data.get("startTime", current_time)
                
                # Calculate elapsed time
                elapsed_time = data.get("elapsedTime", 0)
                
                timer_state = {
                    "type": "timer-start",
                    "isRunning": True,
                    "startTime": start_time,
                    "elapsedTime": elapsed_time,
                    "pausedTime": 0,
                    "pausedTimeRemaining": 0,
                    "duration": duration
                }
                
                print(f"Timer started with duration: {duration}, elapsedTime: {elapsed_time}")
                
                # Broadcast to all clients
                await broadcast(timer_state)
                            
            elif data.get("type") == "timer-pause":
                # Get a valid pausedTime value
                pausedTime = data.get("pausedTime")
                pausedTimeRemaining = data.get("pausedTimeRemaining")
                
                # Make sure we have at least one valid value
                if pausedTime is None and pausedTimeRemaining is not None:
                    pausedTime = pausedTimeRemaining
                elif pausedTime is None and pausedTimeRemaining is None:
                    # Calculate from startTime if possible
                    if "startTime" in timer_state and timer_state["startTime"] > 0:
                        elapsed = int(time.time() * 1000) - timer_state["startTime"]
                        pausedTime = max(0, (timer_state.get("duration", 60) * 1000) - elapsed)
                    else:
                        # Fallback to full duration
                        pausedTime = timer_state.get("duration", 60) * 1000
                
                # Update timer state with valid pausedTime
                global_timer_update({
                    "type": "timer-pause",
                    "pausedTime": pausedTime,
                    "pausedTimeRemaining": pausedTime  # Make them consistent
                })
                # Broadcast to all clients
                await broadcast(timer_state)
                
            elif data.get("type") == "timer-reset":
                # Store the duration before resetting
                duration = timer_state.get("duration", 60)
                
                # ONLY SEND ONE MESSAGE - Use timer-reset type with pause state properties
                timer_state = {
                    "type": "timer-reset",  # Keep as timer-reset
                    "isRunning": False,
                    "startTime": 0,
                    "pausedTime": duration * 1000,
                    "pausedTimeRemaining": duration * 1000,
                    "duration": duration
                }
                
                # Broadcast just once
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

# In your global_timer_update function
def global_timer_update(new_state):
    global timer_state
    
    # Special handling for timer-pause
    if new_state.get('type') == 'timer-pause':
        # Make sure we have valid pausedTime/pausedTimeRemaining
        if 'pausedTime' in new_state and new_state['pausedTime'] is None:
            # Convert None to a numeric value (use client-provided value if available)
            new_state['pausedTime'] = new_state.get('pausedTimeRemaining', 0)
        
        # Ensure isRunning is set to false
        new_state['isRunning'] = False
    
    # Special handling for timer-reset
    elif new_state.get('type') == 'timer-reset':
        # Start fresh with only essential properties
        reset_data = {
            "type": "timer-reset",
            "isRunning": False,
            "startTime": 0,
            "pausedTime": 0,
            "pausedTimeRemaining": 0,
            "duration": new_state.get('duration', 60)
        }
        timer_state.clear()  # Clear existing contents
        timer_state.update(reset_data)  # Add new contents
        return  # Skip the normal update
    
    # Normal property update
    updated_state = timer_state.copy()
    updated_state.update(new_state)
    timer_state = updated_state
    
    # Ensure we have valid type
    if 'type' not in timer_state:
        timer_state['type'] = 'timer-sync'

async def broadcast(message):
    if connected_clients:
        # Convert message to JSON string if it's a dict
        if isinstance(message, dict):
            message_str = json.dumps(message)
        else:
            message_str = message
            
        # Log the broadcast
        client_count = len(connected_clients)
        msg_type = message.get("type", "unknown") if isinstance(message, dict) else "raw"
        print(f"Broadcasting {msg_type} message to {client_count} clients")
        
        # Send to all clients
        websockets_to_remove = set()
        for websocket in connected_clients:
            try:
                await websocket.send(message_str if isinstance(message_str, str) else json.dumps(message_str))
            except websockets.exceptions.ConnectionClosed:
                websockets_to_remove.add(websocket)
        
        # Clean up any closed connections
        for websocket in websockets_to_remove:
            connected_clients.remove(websocket)

def print_clickable_links(ips, http_port=8000):
    print("\n" + "="*70)
    print("🌐 SCORE COUNTER SERVER RUNNING")
    print("="*70)
    
    print("\n📱 ACCESS ON THIS DEVICE:")
    print(f"   http://localhost:{http_port}/display.html")
    print(f"   http://localhost:{http_port}/buttons.html")
    
    if ips:
        print("\n📲 ACCESS FROM OTHER DEVICES:")
        print("-"*50)
        for ip in ips:
            # Make URLs clickable in modern terminals with color highlighting
            print(f"   \033[1;36mhttp://{ip}:{http_port}/display.html\033[0m  <-- CLICK THIS LINK")
            print(f"   http://{ip}:{http_port}/buttons.html")
            print()
    
    print("\n💡 SERVER INFO:")
    print(f"   WebSocket: ws://{ips[0] if ips else 'localhost'}:8765")
    print(f"   Discovery: http://{ips[0] if ips else 'localhost'}:8766/discover")
    
    print("\n💻 COPY THIS URL TO YOUR BROWSER OR PHONE:")
    if ips:
        print(f"   \033[1;32mhttp://{ips[0]}:{http_port}/display.html\033[0m")
    
    print("\n⌨️  Press Ctrl+C to stop the server")
    print("="*70)

def get_local_ip():
    try:
        # This creates a socket that doesn't actually connect
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        # This doesn't actually send any packets
        s.connect(('8.8.8.8', 1))
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except Exception as e:
        print(f"Error getting local IP: {e}")
        
        # Alternative method
        try:
            hostname = socket.gethostname()
            local_ip = socket.gethostbyname(hostname)
            if local_ip != '127.0.0.1':  # Avoid returning localhost
                return local_ip
        except Exception as e:
            print(f"Error with alternative IP detection: {e}")
            
        return 'localhost'  # Fallback

# Start server
async def main():
    # Use 0.0.0.0 to accept connections from any IP
    local_ip = get_local_ip()
    async with websockets.serve(counter_server, "0.0.0.0", 8765):
        print("WebSocket server started on 0.0.0.0:8765")
        print_clickable_links([local_ip], 8000)
        await asyncio.Future()  # Run forever

if __name__ == "__main__":
    asyncio.run(main())

